# Yoombaa - Supabase Email Templates

Clean, minimal email templates for Supabase authentication.

**Brand Color:** `#fe9200`
**Font:** DM Sans (inline web font)

---

## 1. Confirm Sign Up

**Subject:** Confirm your email address

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm Your Email</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                Confirm your email
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                Thanks for signing up for Yoombaa. Please confirm your email address by clicking the button below.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Confirm Email
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Invite User

**Subject:** You've been invited to Yoombaa

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're Invited</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                You've been invited
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                You've been invited to join Yoombaa, Kenya's premier platform for connecting tenants with verified real estate agents.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link

**Subject:** Sign in to Yoombaa

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sign In Link</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                Sign in to Yoombaa
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                Click the button below to sign in to your account. No password required.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Sign In
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                This link expires in 1 hour and can only be used once. If you didn't request this, you can ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** Confirm your new email address

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm Email Change</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                Confirm your new email
              </h1>
              
              <p style="margin: 0 0 16px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                We received a request to change your email address to:
              </p>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #18181b; font-weight: 500; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                {{ .Email }}
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Confirm Change
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                If you didn't request this change, please contact support@yoombaa.com
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Reset Password

**Subject:** Reset your password

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Password</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                Reset your password
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                This link expires in 1 hour. If you didn't request this, you can ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication

**Subject:** Verify your identity

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Identity</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'DM Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border-radius: 8px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 48px 40px 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #fe9200; text-decoration: none;">Yoombaa</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 48px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center; line-height: 1.3; font-family: 'DM Sans', Arial, sans-serif;">
                Verify your identity
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                For security purposes, please verify your identity to continue with the requested action.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: #fe9200; border-radius: 6px;">
                          <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; font-family: 'DM Sans', Arial, sans-serif;">
                            Verify Identity
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; font-family: 'DM Sans', Arial, sans-serif;">
                This link expires in 10 minutes. If you didn't request this, please contact support@yoombaa.com
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5; font-family: 'DM Sans', Arial, sans-serif;">
                © 2025 Yoombaa. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## How to Apply

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template, copy the **Subject** and **HTML code**
3. Click **Save**

## Changes Made to Fix Spam Warning

- Removed `<link>` tag for external fonts (not supported in emails)
- Removed JavaScript `onerror` handler
- Used text-based logo instead of image
- Added `border="0"` to all tables
- Added Outlook-specific CSS fallback
- Used proper button structure with nested tables
- Removed mailto links (can trigger spam filters)
