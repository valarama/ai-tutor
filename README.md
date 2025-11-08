# Dialogflow CX Agent Assist - Ready to Deploy

## 🚀 Quick Deploy (3 Commands)

### 1. Deploy to Cloud Run
```bash
cd dialogflow-cx-agent-assist-ready
gcloud builds submit --config=cloudbuild.yaml --project=chennai-geniai
```

### 2. Setup Firestore
```bash
gcloud firestore databases create --location=us-central1 --project=chennai-geniai
```

### 3. Grant Permissions
```bash
gcloud projects add-iam-policy-binding chennai-geniai --member="serviceAccount:service-372848468363@gcp-sa-dialogflow.iam.gserviceaccount.com" --role="roles/datastore.user"

gcloud projects add-iam-policy-binding chennai-geniai --member="serviceAccount:372848468363-compute@developer.gserviceaccount.com" --role="roles/datastore.user"
```

---

## 📋 What's Included

```
dialogflow-cx-agent-assist-ready/
├── app/
│   ├── api/
│   │   ├── webhook/route.js          # Dialogflow CX webhook
│   │   ├── conversations/route.js    # List conversations
│   │   ├── transcript/route.js       # Get conversation details
│   │   └── chatbot/route.js          # AI chatbot
│   ├── layout.js                      # App layout
│   └── page.js                        # Dashboard homepage
│
├── package.json                       # Dependencies
├── Dockerfile                         # Container image
├── cloudbuild.yaml                    # GCP deployment config
├── next.config.js                     # Next.js config
└── README.md                          # This file
```

---

## 🔧 Configure Dialogflow CX

### Get Webhook URL
```bash
gcloud run services describe dialogflow-cx-agent-assist --region=us-central1 --format="value(status.url)" --project=chennai-geniai
```

Output example: `https://dialogflow-cx-agent-assist-xxxxx-uc.a.run.app`

### Add to Dialogflow CX

1. **Go to**: https://dialogflow.cloud.google.com/cx/projects/chennai-geniai/locations/us-central1/agents/be40e635-daec-437d-8d1f-d1b97344d773/webhooks

2. **Create Webhook**:
   - Display name: `Agent-Assist-Webhook`
   - URL: `https://dialogflow-cx-agent-assist-xxxxx-uc.a.run.app/api/webhook`
   - Timeout: 30 seconds
   - Save

3. **Add to Flow**:
   - Go to **Default Start Flow** → **Start Page**
   - Under **Fulfillment**, enable webhook
   - Select `Agent-Assist-Webhook`
   - Save

---

## 🧪 Test

### Test Webhook
```bash
curl -X POST https://your-service.run.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"sessionInfo":{"session":"test-123"},"text":"hello","intentInfo":{"displayName":"test"}}'
```

### Test in Dialogflow CX Simulator
1. Go to **Test Agent** in Dialogflow CX Console
2. Type: "What is quantum computing?"
3. Verify webhook is called

### Check Firestore
Go to: https://console.firebase.google.com/project/chennai-geniai/firestore

---

## 📊 API Endpoints

- **POST /api/webhook** - Dialogflow CX webhook handler
- **GET /api/conversations** - List all conversations from Firestore
- **GET /api/transcript?sessionId={id}** - Get conversation with AI suggestions
- **POST /api/chatbot** - AI chatbot endpoint

---

## 🔐 Service Accounts

The following service accounts need Firestore access:

- `service-372848468363@gcp-sa-dialogflow.iam.gserviceaccount.com`
- `372848468363-compute@developer.gserviceaccount.com`

Permissions are granted with the commands in step 3 above.

---

## 📝 Your Dialogflow CX Agent

- **Project**: chennai-geniai
- **Location**: us-central1
- **Agent ID**: be40e635-daec-437d-8d1f-d1b97344d773
- **Agent Name**: vertex-tanining

---

## ✅ Success Checklist

- [ ] Deployed to Cloud Run
- [ ] Firestore database created
- [ ] Permissions granted
- [ ] Webhook created in Dialogflow CX
- [ ] Webhook added to flow
- [ ] Tested with simulator
- [ ] Data appears in Firestore

---

## 📞 Support

View logs:
```bash
gcloud logging tail "resource.type=cloud_run_revision" --project=chennai-geniai --limit=50
```

Check service:
```bash
gcloud run services list --project=chennai-geniai
```

---

**Ready to deploy!** Just run:
```bash
gcloud builds submit --config=cloudbuild.yaml --project=chennai-geniai
```
