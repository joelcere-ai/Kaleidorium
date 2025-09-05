# 📧 Welcome Email Setup Guide

## Overview
This guide will help you set up a welcome email template in EmailJS that automatically sends to new users when they register on Kaleidorium.

## 🔧 EmailJS Configuration

### 1. Create Welcome Email Template

1. **Login to EmailJS Dashboard**: Go to [emailjs.com](https://www.emailjs.com/) and login
2. **Navigate to Email Templates**: Click on "Email Templates" in the sidebar
3. **Create New Template**: Click "Create New Template"
4. **Template ID**: Set a recognizable ID like `kaleidorium_welcome`

### 2. Template Variables

Your template can use these variables:

#### User Information:
- `{{to_name}}` - Full name of the user
- `{{to_email}}` - User's email address  
- `{{first_name}}` - User's first name
- `{{full_name}}` - Full name (same as to_name)
- `{{user_type}}` - Either "artist" or "collector"

#### Conditional Variables:
- `{{is_artist}}` - true if user is an artist
- `{{is_collector}}` - true if user is a collector

#### Personalized Messages:
- `{{welcome_message}}` - Personalized welcome message based on user type
- `{{next_steps}}` - Suggested next steps based on user type

#### Branding:
- `{{from_name}}` - "Kaleidorium Team"
- `{{from_email}}` - "kurator@kaleidorium.com"

### 3. Sample Welcome Email Template

Here's a suggested template structure:

```html
Subject: Welcome to Kaleidorium, {{first_name}}! 🎨

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Kaleidorium</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Kaleidorium!</h1>
        <p style="font-size: 18px; color: #666;">{{welcome_message}}</p>
    </div>

    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #1e40af; margin-top: 0;">Hi {{first_name}},</h2>
        
        <p>We're thrilled to have you join our community of art lovers! Kaleidorium is designed to connect people with art they'll truly love through our curated discovery experience.</p>
        
        {{#is_collector}}
        <h3>🎨 As a Collector, you can:</h3>
        <ul>
            <li>Discover artwork curated to your personal taste</li>
            <li>Build your personal collection of favorite pieces</li>
            <li>Connect directly with artists whose work speaks to you</li>
            <li>Get personalized recommendations as you explore</li>
        </ul>
        {{/is_collector}}

        {{#is_artist}}
        <h3>🖼️ As an Artist, you can:</h3>
        <ul>
            <li>Upload and showcase your artwork to interested collectors</li>
            <li>Reach collectors who genuinely appreciate your style</li>
            <li>Build meaningful connections with art enthusiasts</li>
            <li>Get insights into how your work resonates with viewers</li>
        </ul>
        {{/is_artist}}

        <p><strong>Next Steps:</strong> {{next_steps}}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.kaleidorium.com" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Start Exploring Kaleidorium
        </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>Welcome to the Kaleidorium community!</p>
        <p>The Kaleidorium Team<br>
        <a href="mailto:kurator@kaleidorium.com" style="color: #2563eb;">kurator@kaleidorium.com</a></p>
        
        <p style="margin-top: 20px;">
            <a href="https://www.kaleidorium.com/about" style="color: #6b7280; margin: 0 10px;">About</a>
            <a href="https://www.kaleidorium.com/contact" style="color: #6b7280; margin: 0 10px;">Contact</a>
            <a href="https://www.kaleidorium.com/terms" style="color: #6b7280; margin: 0 10px;">Terms</a>
        </p>
    </div>

</body>
</html>
```

### 4. Environment Variables

Add this new environment variable to your Vercel deployment:

```
NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE_ID=your_welcome_template_id_here
```

### 5. Test the Setup

1. **Create a test registration** on your local development server
2. **Check the console logs** for "Welcome email sent successfully"
3. **Verify the email** is received in the test user's inbox
4. **Check EmailJS dashboard** for email delivery status

## 🎯 Features

### Automatic Triggers
- ✅ **Collector Registration**: Sends welcome email immediately after successful registration
- ✅ **Artist Registration**: Sends welcome email after artist profile creation
- ✅ **Personalization**: Different messages for artists vs collectors
- ✅ **Error Handling**: Won't block registration if email fails
- ✅ **Rate Limiting**: Prevents email spam abuse
- ✅ **Validation**: Sanitizes all input data before sending

### Email Content
- 🎨 **Branded Design**: Kaleidorium branding and colors
- 👤 **Personalized**: Uses user's actual name and type
- 📋 **Next Steps**: Guides users on what to do next
- 🔗 **Call to Action**: Direct link back to the platform
- 📞 **Contact Info**: Easy way to reach support

## 🔍 Troubleshooting

### Common Issues:

1. **Email not sending**:
   - Check EmailJS service status
   - Verify template ID in environment variables
   - Check browser console for errors

2. **Template variables not working**:
   - Ensure variable names match exactly
   - Check for typos in template
   - Verify conditional blocks syntax

3. **Rate limiting**:
   - Users can only trigger 10 welcome emails per hour
   - This prevents abuse while allowing legitimate use

## 📊 Monitoring

Check these locations for email status:
- **Browser Console**: Success/error logs
- **EmailJS Dashboard**: Delivery statistics  
- **Vercel Logs**: Server-side error tracking

Your welcome email system is now ready to onboard new users! 🎉 