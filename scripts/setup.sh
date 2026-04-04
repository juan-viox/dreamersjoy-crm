#!/bin/bash
echo ""
echo "  VioX CRM Setup"
echo "  ==============="
echo ""
echo "  This script configures your standalone CRM instance."
echo ""

# Prompt for Supabase credentials
read -p "  Supabase URL: " SUPABASE_URL
read -p "  Supabase anon key: " SUPABASE_ANON_KEY
read -p "  Supabase service role key: " SUPABASE_SERVICE_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo ""
  echo "  Error: All Supabase credentials are required."
  exit 1
fi

# Generate API key for site integration
API_KEY=$(openssl rand -hex 32)

# Generate .env.local
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Site Integration API Key (used by cinematic site to push data)
SITE_API_KEY=$API_KEY

# Email (optional - add your Resend API key to enable email sending)
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL=hello@yourdomain.com
EOF

echo ""
echo "  .env.local created successfully!"
echo ""
echo "  Next steps:"
echo "  1. Run the SQL migration in your Supabase SQL Editor:"
echo "     supabase/migrations/001_standalone_schema.sql"
echo ""
echo "  2. Edit src/crm.config.ts with your business info"
echo ""
echo "  3. Start the dev server:"
echo "     npm run dev"
echo ""
echo "  4. Your site integration API key:"
echo "     $API_KEY"
echo ""
echo "  Add this to your cinematic site's JavaScript:"
echo "  var CRM = {"
echo "    apiUrl: 'https://your-crm-domain.com/api/v1/ingest',"
echo "    apiKey: '$API_KEY'"
echo "  };"
echo ""
