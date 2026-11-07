import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: Service role key missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client with caller's token to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client with service role to verify Super Admin status
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check caller suspension status
    const { data: callerAccount } = await adminClient
      .from('admin_accounts')
      .select('role, status')
      .eq('id', user.id)
      .maybeSingle();

    if (callerAccount?.status === 'suspended') {
      return new Response(
        JSON.stringify({ error: 'Access denied: Your administrative account has been suspended.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerRole } = await adminClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    const normalizedCallerEmail = (user.email || '').trim().toLowerCase();
    const isSuperAdminCaller =
      callerAccount?.role === 'superadmin' ||
      !!callerRole ||
      ((normalizedCallerEmail === 'admin.zadafoods.superad@gmail.com' || normalizedCallerEmail === 'superadmin@zadafoods.com') && callerAccount?.status !== 'suspended');

    if (!isSuperAdminCaller) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Super Admin authority required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, email, fullName, password, permissions, targetUserId, reason } = body;

    // 1. ACTION: CREATE ADMIN
    if (action === 'CREATE_ADMIN') {
      if (!email || !fullName || !password) {
        return new Response(
          JSON.stringify({ error: 'Email, Full Name, and Password are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Auth User via admin client (service-role)
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          role: 'admin'
        }
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = newUserData.user.id;

      // Ensure profile exists
      await adminClient.from('profiles').upsert({
        id: newUserId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: 'admin'
      });

      // Insert admin role
      await adminClient.from('admin_roles').upsert({
        user_id: newUserId,
        role: 'admin',
        granted_by: user.id
      });

      // Insert account tracking
      await adminClient.from('admin_accounts').upsert({
        id: newUserId,
        role: 'admin',
        status: 'active'
      });

      // Insert granular permissions
      if (Array.isArray(permissions) && permissions.length > 0) {
        const permRows = permissions.map((p: string) => ({
          user_id: newUserId,
          permission: p,
          granted_by: user.id
        }));
        await adminClient.from('admin_permissions').insert(permRows);
      }

      // Audit Log
      await adminClient.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'CREATE_ADMIN_ACCOUNT',
        entity: 'admin_accounts',
        entity_id: newUserId,
        new_value: { email, fullName, permissions }
      });

      return new Response(
        JSON.stringify({
          success: true,
          admin: {
            id: newUserId,
            email,
            fullName,
            role: 'admin',
            status: 'active',
            permissions: permissions || []
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. ACTION: UPDATE PERMISSIONS
    if (action === 'UPDATE_PERMISSIONS') {
      if (!targetUserId || !Array.isArray(permissions)) {
        return new Response(
          JSON.stringify({ error: 'targetUserId and permissions array are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent modifying super admin permissions through this route
      const { data: targetAccount } = await adminClient
        .from('admin_accounts')
        .select('role')
        .eq('id', targetUserId)
        .maybeSingle();

      if (targetAccount?.role === 'superadmin' && targetUserId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot modify Super Admin permissions.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Replace permissions
      await adminClient.from('admin_permissions').delete().eq('user_id', targetUserId);

      if (permissions.length > 0) {
        const permRows = permissions.map((p: string) => ({
          user_id: targetUserId,
          permission: p,
          granted_by: user.id
        }));
        await adminClient.from('admin_permissions').insert(permRows);
      }

      // Audit Log
      await adminClient.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'UPDATE_ADMIN_PERMISSIONS',
        entity: 'admin_permissions',
        entity_id: targetUserId,
        new_value: { permissions }
      });

      return new Response(
        JSON.stringify({ success: true, permissions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. ACTION: TOGGLE SUSPENSION
    if (action === 'TOGGLE_SUSPEND') {
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'targetUserId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent suspending root super admin
      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('email, role')
        .eq('id', targetUserId)
        .single();

      const normalizedTargetEmail = (targetProfile?.email || '').trim().toLowerCase();
      if (
        normalizedTargetEmail === 'admin.zadafoods.superad@gmail.com' ||
        normalizedTargetEmail === 'superadmin@zadafoods.com' ||
        targetProfile?.role === 'superadmin'
      ) {
        return new Response(
          JSON.stringify({ error: 'The Super Administrator account cannot be suspended or demoted.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: curAcc } = await adminClient
        .from('admin_accounts')
        .select('status')
        .eq('id', targetUserId)
        .single();

      const newStatus = curAcc?.status === 'suspended' ? 'active' : 'suspended';

      await adminClient.from('admin_accounts').update({
        status: newStatus,
        suspended_at: newStatus === 'suspended' ? new Date().toISOString() : null,
        suspended_reason: newStatus === 'suspended' ? (reason || 'Administrative action') : null
      }).eq('id', targetUserId);

      // Audit Log
      await adminClient.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: newStatus === 'suspended' ? 'SUSPEND_ADMIN' : 'REACTIVATE_ADMIN',
        entity: 'admin_accounts',
        entity_id: targetUserId,
        new_value: { status: newStatus, reason }
      });

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. ACTION: DELETE ADMIN
    if (action === 'DELETE_ADMIN') {
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'targetUserId is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent deleting root super admin
      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('email, role')
        .eq('id', targetUserId)
        .single();

      const normalizedTargetEmail = (targetProfile?.email || '').trim().toLowerCase();
      if (
        normalizedTargetEmail === 'admin.zadafoods.superad@gmail.com' ||
        normalizedTargetEmail === 'superadmin@zadafoods.com' ||
        targetProfile?.role === 'superadmin'
      ) {
        return new Response(
          JSON.stringify({ error: 'The Super Administrator account cannot be removed or deleted.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete permissions, roles, and administrative account record
      await adminClient.from('admin_permissions').delete().eq('user_id', targetUserId);
      await adminClient.from('admin_roles').delete().eq('user_id', targetUserId);
      await adminClient.from('admin_accounts').delete().eq('id', targetUserId);

      // Audit Log
      await adminClient.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'REMOVE_ADMIN_ACCOUNT',
        entity: 'admin_accounts',
        entity_id: targetUserId,
        new_value: { removed_email: normalizedTargetEmail }
      });

      // Optionally delete auth user
      try {
        await adminClient.auth.admin.deleteUser(targetUserId);
      } catch (e: any) {
        console.warn('Failed to delete auth user:', e.message);
      }

      return new Response(
        JSON.stringify({ success: true, removedUserId: targetUserId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. ACTION: BOOTSTRAP SUPER ADMIN
    if (action === 'BOOTSTRAP_SUPER_ADMIN') {
      const targetSuperAdminEmail = (body.targetEmail || 'admin.zadafoods.superad@gmail.com').trim().toLowerCase();

      const { data: usersData } = await adminClient.auth.admin.listUsers();
      if (usersData?.users) {
        const matchingUser = usersData.users.find(
          (u: any) => (u.email || '').trim().toLowerCase() === targetSuperAdminEmail
        );
        if (matchingUser) {
          await adminClient.from('profiles').upsert({
            id: matchingUser.id,
            email: targetSuperAdminEmail,
            role: 'superadmin'
          });
          await adminClient.from('admin_roles').upsert({
            user_id: matchingUser.id,
            role: 'superadmin'
          });
          await adminClient.from('admin_accounts').upsert({
            id: matchingUser.id,
            role: 'superadmin',
            status: 'active'
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, email: targetSuperAdminEmail }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
