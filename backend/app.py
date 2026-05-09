from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
import json

app = Flask(__name__)
crm_deals = []
CORS(app)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# ==========================================
# ANALYZE PIPELINE
# ==========================================

@app.route("/analyze", methods=["POST"])
def analyze():

    try:

        data = request.json

        pipeline_data = data.get(
            "pipeline",
            []
        )

        # ==========================================
        # COMPACT PIPELINE
        # ==========================================

        compact_pipeline = []

        for deal in pipeline_data:

            compact_pipeline.append({

                "Company":
                deal.get("Company"),

                "Stage":
                deal.get("Stage"),

                "Score":
                deal.get("Score"),

                "Priority":
                deal.get("Priority"),

                "Risk":
                deal.get("Risk")

            })

        # ==========================================
        # AI PROMPT
        # ==========================================

        prompt = f"""
You are an AI RevOps strategist.

Analyze this sales pipeline.

Return ONLY valid JSON.

Format:

{
 {
    "strategic_insight": "...",

    "executive_insight": "...",

    "risks": [
        "...",
        "..."
    ],

    "actions": [
        "...",
        "..."
    ]
}}

Pipeline Summary:
{compact_pipeline}

Rules:
- concise
- executive-friendly
- strategic
- actionable
- identify pipeline risks
- identify GTM opportunities
- consider WhatsApp-native engagement
- strategic_insight should be short
- executive_insight should be detailed
"""

        # ==========================================
        # OPENAI REQUEST
        # ==========================================

        response = client.chat.completions.create(

            model="gpt-4.1-mini",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.4

        )

        # ==========================================
        # CLEAN RESPONSE
        # ==========================================

        ai_response = (
            response
            .choices[0]
            .message
            .content
        )

        ai_response = ai_response.replace(
            "```json",
            ""
        )

        ai_response = ai_response.replace(
            "```",
            ""
        )

        ai_response = ai_response.strip()

        # ==========================================
        # PARSE JSON
        # ==========================================

        parsed = json.loads(ai_response)

        # ==========================================
        # RETURN RESPONSE
        # ==========================================

        return jsonify({

            "success": True,
            "strategic_insight":
             parsed.get(
             "strategic_insight",
             ""
            ),

            "executive_insight":
            parsed.get(
                "executive_insight",
                ""
            ),

            "risks":
            parsed.get(
                "risks",
                []
            ),

            "actions":
            parsed.get(
                "actions",
                []
            )

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500
# ==========================================
# FRESHWORKS WEBHOOK
# ==========================================

@app.route("/webhook", methods=["POST"])
def webhook():

    try:

        payload = request.json

        print("Webhook received:")
        print(payload)

        formatted_deal = {

    "name":
    payload.get("deal_name"),

    "amount":
    payload.get("deal_amount"),

    "stage":
    payload.get("deal_stage"),

    "probability":
    payload.get("deal_probability"),

    "updated_at":
    payload.get("updated_at")

}
        }

        crm_deals.append(formatted_deal)

        print("Stored CRM Deals:")
        print(crm_deals)

        return jsonify({

            "success": True,

            "message":
            "Webhook received",

            "stored_deals":
            len(crm_deals)

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500

       
 # ==========================================
# GET CRM DEALS
# ==========================================

@app.route("/crm-deals", methods=["GET"])
def get_crm_deals():

    return jsonify({

        "success": True,

        "deals": crm_deals

    })
# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/")
def home():

    return jsonify({

        "status":
        "Backend API running successfully"

    })

# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    app.run(debug=True)