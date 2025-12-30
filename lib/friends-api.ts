import { supabase } from './supabase';

export interface FriendInvitation {
    id: string;
    sender_email: string;
    sender_name?: string;
    recipient_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    created_at: string;
    responded_at?: string;
}

export interface Friendship {
    id: string;
    friend_email: string;
    friend_name?: string;
    friendship_created_at: string;
}

/**
 * Send a friend invitation
 */
export async function sendFriendInvitation(
    recipientEmail: string,
    message?: string
): Promise<{ success: boolean; isNewUser: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, isNewUser: false, error: 'Not authenticated' };
        }

        // Check if recipient exists
        const { data: recipientUser } = await supabase
            .from('users')
            .select('email, name, push_token')
            .eq('email', recipientEmail)
            .single();

        // Check if already friends
        const { data: existingFriendship } = await supabase
            .rpc('are_friends', {
                email1: user.email,
                email2: recipientEmail
            });

        if (existingFriendship) {
            return { success: false, isNewUser: false, error: 'Already friends' };
        }

        // Check for existing invitation
        const { data: existingInvitation } = await supabase
            .from('friend_invitations')
            .select('*')
            .or(`and(sender_email.eq.${user.email},recipient_email.eq.${recipientEmail}),and(sender_email.eq.${recipientEmail},recipient_email.eq.${user.email})`)
            .eq('status', 'pending')
            .single();

        if (existingInvitation) {
            return { success: false, isNewUser: false, error: 'Invitation already sent' };
        }

        // Create invitation
        const { error: inviteError } = await supabase
            .from('friend_invitations')
            .insert({
                sender_email: user.email,
                recipient_email: recipientEmail,
                message: message || null
            });

        if (inviteError) {
            console.error('[sendFriendInvitation] Error:', inviteError);
            return { success: false, isNewUser: false, error: inviteError.message };
        }

        // Send notification
        if (recipientUser?.push_token) {
            // Existing user - send push notification
            await sendFriendRequestPush(recipientUser.push_token, user.email, recipientUser.name);
            return { success: true, isNewUser: false };
        } else {
            // New user - send email invitation
            const { data: senderData } = await supabase
                .from('users')
                .select('name')
                .eq('email', user.email)
                .single();

            await supabase.functions.invoke('send-friend-invitation-email', {
                body: {
                    recipientEmail,
                    senderEmail: user.email,
                    senderName: senderData?.name || user.email
                }
            });
            return { success: true, isNewUser: true };
        }
    } catch (error: any) {
        console.error('[sendFriendInvitation] Exception:', error);
        return { success: false, isNewUser: false, error: error.message };
    }
}

/**
 * Accept a friend invitation
 */
export async function acceptFriendInvitation(
    invitationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get invitation
        const { data: invitation, error: fetchError } = await supabase
            .from('friend_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();

        if (fetchError || !invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.recipient_email !== user.email) {
            return { success: false, error: 'Unauthorized' };
        }

        if (invitation.status !== 'pending') {
            return { success: false, error: 'Invitation already processed' };
        }

        // Create friendship (ensure alphabetical order)
        const emails = [invitation.sender_email, invitation.recipient_email].sort();
        const { error: friendshipError } = await supabase
            .from('friendships')
            .insert({
                user1_email: emails[0],
                user2_email: emails[1]
            });

        if (friendshipError) {
            console.error('[acceptFriendInvitation] Friendship error:', friendshipError);
            return { success: false, error: friendshipError.message };
        }

        // Update invitation status
        const { error: updateError } = await supabase
            .from('friend_invitations')
            .update({
                status: 'accepted',
                responded_at: new Date().toISOString()
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('[acceptFriendInvitation] Update error:', updateError);
        }

        // Notify sender
        await notifySenderAboutResponse(invitation, 'accepted');

        return { success: true };
    } catch (error: any) {
        console.error('[acceptFriendInvitation] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reject a friend invitation
 */
export async function rejectFriendInvitation(
    invitationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get invitation
        const { data: invitation, error: fetchError } = await supabase
            .from('friend_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();

        if (fetchError || !invitation) {
            return { success: false, error: 'Invitation not found' };
        }

        if (invitation.recipient_email !== user.email) {
            return { success: false, error: 'Unauthorized' };
        }

        // Update invitation status
        const { error: updateError } = await supabase
            .from('friend_invitations')
            .update({
                status: 'rejected',
                responded_at: new Date().toISOString()
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('[rejectFriendInvitation] Update error:', updateError);
            return { success: false, error: updateError.message };
        }

        // Notify sender
        await notifySenderAboutResponse(invitation, 'rejected');

        return { success: true };
    } catch (error: any) {
        console.error('[rejectFriendInvitation] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get pending invitations for current user
 */
export async function getPendingInvitations(): Promise<{
    success: boolean;
    invitations?: FriendInvitation[];
    error?: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .rpc('get_pending_invitations', { user_email: user.email });

        if (error) {
            console.error('[getPendingInvitations] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, invitations: data || [] };
    } catch (error: any) {
        console.error('[getPendingInvitations] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user's friends list
 */
export async function getFriends(): Promise<{
    success: boolean;
    friends?: Friendship[];
    error?: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .rpc('get_friends', { user_email: user.email });

        if (error) {
            console.error('[getFriends] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, friends: data || [] };
    } catch (error: any) {
        console.error('[getFriends] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove a friend
 */
export async function removeFriend(friendEmail: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return { success: false, error: 'Not authenticated' };
        }

        const emails = [user.email, friendEmail].sort();

        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('user1_email', emails[0])
            .eq('user2_email', emails[1]);

        if (error) {
            console.error('[removeFriend] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[removeFriend] Exception:', error);
        return { success: false, error: error.message };
    }
}

// Helper functions
async function sendFriendRequestPush(pushToken: string, senderEmail: string, senderName?: string) {
    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: pushToken,
                title: `${senderName || senderEmail} möchte dein Freund werden`,
                body: 'Tippe um die Anfrage anzusehen',
                data: { type: 'friend_request' }
            })
        });
    } catch (error) {
        console.error('[sendFriendRequestPush] Error:', error);
    }
}

async function notifySenderAboutResponse(
    invitation: any,
    response: 'accepted' | 'rejected'
) {
    try {
        // Get sender details
        const { data: sender } = await supabase
            .from('users')
            .select('name, push_token')
            .eq('email', invitation.sender_email)
            .single();

        // Get recipient name
        const { data: recipient } = await supabase
            .from('users')
            .select('name')
            .eq('email', invitation.recipient_email)
            .single();

        const recipientName = recipient?.name || invitation.recipient_email;

        // Send push notification
        if (sender?.push_token) {
            const title = response === 'accepted'
                ? `${recipientName} hat deine Anfrage angenommen`
                : 'Freundschaftsanfrage abgelehnt';

            const body = response === 'accepted'
                ? 'Ihr seid jetzt Freunde!'
                : `${recipientName} hat deine Anfrage abgelehnt`;

            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: sender.push_token,
                    title,
                    body,
                    data: { type: 'friend_response', response }
                })
            });
        }

        // TODO: Send email notification
    } catch (error) {
        console.error('[notifySenderAboutResponse] Error:', error);
    }
}
