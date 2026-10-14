// =========================================================================
// نظام موظف شركة أحمد الآلي المتكامل (24/7 WhatsApp AI Agent Server)
// =========================================================================

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// 1. الثوابت الرسمية المعتمدة من الأستاذ أحمد
const AHMED_PHONE = "07800033507";
const PAYMENT_WALLETS = "ZainCash: 07728219755 | SuperQi: 7113901883";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "ضع_مفتاح_جيمناي_هنا";

const PRICE_LIST = `
- تصميم موقع إلكتروني احترافي: 50,000 دينار عراقي (خلال 24 ساعة)
- نظام أتمتة الرد التلقائي: 75,000 دينار عراقي (خلال 12 ساعة)
- وكيل ذكي للواتساب والحجوزات: 100,000 دينار عراقي (خلال 24 ساعة)
- باقة المحتوى والريلز الشهرية: 100,000 دينار عراقي
- الباقة الملكية الكاملة: 200,000 دينار عراقي (خلال 48 ساعة)
`;

// 2. نظام التوجيه والتعليمات الصارمة للموظف الآلي (System Prompt)
const AGENT_SYSTEM_INSTRUCTION = `
أنت موظف مبيعات وخدمة عملاء ذكي يمثل شركة الأستاذ أحمد للحلول الرقمية في العراق.
تتحدث باللهجة العراقية المؤدبة والراقية جداً.
مهمتك هي استقبال رسائل العملاء (أطباء، أصحاب صالونات، تجار)، الإجابة عن استفساراتهم، وعرض قائمة الأسعار بدقة متناهية دون أي زيادة أو نقصان.
ممنوع منعاً باتاً اقتراح أسعار أو خدمات غير موجودة في القائمة الرسمية.
إذا طلب العميل مكالمة هاتفية أو استفساراً معقداً، أجب حرفياً بـ:
"تدلل دكتور/أستاذ، حولت طلبك للأستاذ أحمد وسيتصل بك قريباً على الرقم ${AHMED_PHONE}".
عندما يرسل العميل وصل التحويل على زين كاش (${PAYMENT_WALLETS})، قم بفحص الصورة، ثم أرسل له روابط مشروعه جاهزة ومبروك عليه.
`;

// 3. استقبال رسائل الواتساب الواردة (Webhook Endpoint)
app.post('/webhook', async (req, res) => {
  try {
    const incomingData = req.body;
    
    // استخراج رقم المرسل ونص الرسالة من واتساب
    const senderPhone = incomingData.from;
    const userMessage = incomingData.message;

    console.log(`📩 رسالة جديدة من [${senderPhone}]: ${userMessage}`);

    // إرسال الطلب إلى عقل Gemini AI مع التعليمات الصارمة
    const aiResponseText = await callGeminiAgent(userMessage);

    // الرد على العميل عبر الواتساب
    await sendWhatsAppMessage(senderPhone, aiResponseText);

    res.status(200).send({ status: 'success', reply: aiResponseText });
  } catch (error) {
    console.error("❌ خطأ في معالجة الويب هوك:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// دالة الاتصال بذكاء Gemini
async function callGeminiAgent(userMsg) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [
        { role: "user", parts: [{ text: `${AGENT_SYSTEM_INSTRUCTION}\n\nسؤال العميل: ${userMsg}` }] }
      ]
    };

    const response = await axios.post(url, payload);
    const text = response.data.candidates[0].content.parts[0].text;
    return text;
  } catch (err) {
    return `أهلاً بك أستاذي، عذراً صار عندنا خلل بسيط بالاتصال، تكدر تتصل بالأستاذ أحمد مباشرة على ${AHMED_PHONE} وتدلل!`;
  }
}

// دالة إرسال الرسالة عبر واتساب (Meta Cloud API)
async function sendWhatsAppMessage(recipientPhone, messageText) {
  const token = process.env.WHATSAPP_TOKEN || "ضع_مفتاح_واتساب_ميو_هنا";
  const phoneId = process.env.WHATSAPP_PHONE_ID || "ضع_رقم_تعريف_الهاتف_هنا";
  
  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  
  try {
    await axios.post(url, {
      messaging_product: "whatsapp",
      to: recipientPhone,
      text: { body: messageText }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ تم إرسال الرد بنجاح إلى ${recipientPhone}`);
  } catch (e) {
    console.error("⚠️ فشل إرسال رسالة الواتساب:", e.response?.data || e.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 سيرفر الموظف الآلي لشركة أحمد شغال الآن على البورت ${PORT}`);
});