async function loadCRMDeals() {

    try {

        var response = await fetch(

            "https://funnel-triage-backend.onrender.com/crm-deals"

        );

        var result = await response.json();

        if (result.success) {

            pipelineData = [];

            for (
                var i = 0;
                i < result.deals.length;
                i++
            ) {

                var deal =
                    result.deals[i];

                pipelineData.push({

                    Company:
                    deal.name,

                    Industry:
                    "SaaS",

                    Deal_Size:
                    parseInt(deal.amount || 0),

                    Stage:
                    deal.stage || "Discovery",

                    Days_in_Stage:
                    5,

                    Last_Activity_Days:
                    2,

                    Decision_Maker_Engaged:
                    "Yes",

                    Region:
                    "India"

                });

            }

            processPipelineData();

        }

    }
    catch (error) {

        console.log(error);

    }

}
var pipelineData = [];

var csvFileInput = document.getElementById("csvFile");
var pipelineTable = document.getElementById("pipelineTable");
var analyzeBtn = document.getElementById("analyzeBtn");
var summaryText = document.getElementById("summaryText");

csvFileInput.addEventListener("change", handleCSVUpload);
analyzeBtn.addEventListener("click", analyzePipeline);

// ==========================================
// CSV UPLOAD
// ==========================================

function handleCSVUpload(event) {

    var file = event.target.files[0];

    if (!file) {
        return;
    }

    Papa.parse(file, {

        header: true,
        skipEmptyLines: true,

        complete: function(results) {

            pipelineData = results.data;

            processPipelineData();

            updateStrategicInsight();

            updateKPIs();

            alert("CSV uploaded successfully!");

        }

    });

}

// ==========================================
// PROCESS DATA
// ==========================================

function processPipelineData() {

    for (var i = 0; i < pipelineData.length; i++) {

        var row = pipelineData[i];

        row.Score = calculateScore(row);

        row.Priority = calculatePriority(row.Score);

        row.Channel = recommendChannel(row);

        row.Risk = calculateRisk(row);

    }

    renderTable(pipelineData);
updateKPIs();
    renderDealInsights();

    renderRiskTable();

}

// ==========================================
// SCORE ENGINE
// ==========================================

function calculateScore(row) {

    var score = 0;

    var dealSize =
        parseInt(row.Deal_Size || 0);

    var lastActivity =
        parseInt(row.Last_Activity_Days || 0);

    var daysInStage =
        parseInt(row.Days_in_Stage || 0);

    // Deal Size

    if (dealSize > 50000) {

        score += 30;

    }
    else if (dealSize >= 20000) {

        score += 20;

    }
    else {

        score += 10;

    }

    // Stage

    if (row.Stage === "Negotiation") {

        score += 20;

    }
    else if (row.Stage === "Proposal") {

        score += 15;

    }
    else if (row.Stage === "Demo") {

        score += 10;

    }
    else {

        score += 5;

    }

    // Activity

    if (lastActivity <= 3) {

        score += 20;

    }
    else if (lastActivity <= 7) {

        score += 10;

    }

    // Decision Maker

    if (
        row.Decision_Maker_Engaged === "Yes"
    ) {

        score += 15;

    }

    // Stuck Penalty

    if (daysInStage > 14) {

        score -= 10;

    }

    return score;

}

// ==========================================
// PRIORITY
// ==========================================

function calculatePriority(score) {

    if (score >= 75) {

        return "🔥 High";

    }

    if (score >= 50) {

        return "⚖️ Medium";

    }

    return "❄️ Low";

}

// ==========================================
// CHANNEL RECOMMENDATION
// ==========================================

function recommendChannel(row) {

    var region = row.Region;

    if (

        (
            region === "India" ||
            region === "UAE" ||
            region === "LATAM"
        )

        &&

        row.Stage !== "Discovery"

    ) {

        return "WhatsApp + Email";

    }

    if (

        row.Stage === "Proposal" ||
        row.Stage === "Negotiation"

    ) {

        return "Executive Call";

    }

    return "Email + LinkedIn";

}

// ==========================================
// RISK ENGINE
// ==========================================

function calculateRisk(row) {

    var daysInStage =
        parseInt(row.Days_in_Stage || 0);

    var lastActivity =
        parseInt(row.Last_Activity_Days || 0);

    if (

        daysInStage > 14 ||

        lastActivity > 7 ||

        row.Decision_Maker_Engaged === "No"

    ) {

        return "⚠️ At Risk";

    }

    return "Healthy";

}

// ==========================================
// PIPELINE TABLE
// ==========================================

function renderTable(data) {

    pipelineTable.innerHTML = "";

    data.sort(function(a, b) {

        return b.Score - a.Score;

    });

    for (var i = 0; i < data.length; i++) {

        var row = data[i];

        var tr =
            document.createElement("tr");

        tr.innerHTML =

            "<td>" + row.Company + "</td>" +

            "<td>" + row.Industry + "</td>" +

            "<td>" + row.Stage + "</td>" +

            "<td>" + row.Score + "</td>" +

            "<td>" + row.Priority + "</td>" +

            "<td>" + row.Channel + "</td>";

        pipelineTable.appendChild(tr);

    }

}

// ==========================================
// DEAL PRIORITIZATION
// ==========================================

function renderDealInsights() {

    var container =
        document.getElementById(
            "dealInsights"
        );

    var highPriorityDeals =
        pipelineData.filter(function(row) {

            return row.Priority === "🔥 High";

        });

    if (highPriorityDeals.length === 0) {

        container.innerHTML =
            "No high-priority deals detected.";

        return;

    }

    var html = "";

    for (
        var i = 0;
        i < highPriorityDeals.length;
        i++
    ) {

        var deal = highPriorityDeals[i];

        html +=

        '<div class="deal-card">' +

            '<div class="deal-top">' +

                '<div>' +

                    '<div class="deal-company">' +

                        deal.Company +

                    '</div>' +

                    '<div class="deal-meta">' +

                        deal.Industry +
                        ' • ' +
                        deal.Stage +

                    '</div>' +

                '</div>' +

                '<div class="deal-score">' +

                    deal.Score +

                '</div>' +

            '</div>' +

            '<div class="deal-bottom">' +

                '<span class="deal-pill">' +

                    deal.Channel +

                '</span>' +

                '<span class="deal-priority">' +

                    deal.Priority +

                '</span>' +

            '</div>' +

        '</div>';

    }

    container.innerHTML = html;

}

// ==========================================
// RISK TABLE
// ==========================================

function renderRisks(risks) {

    var container =
        document.getElementById(
            "riskInsights"
        );

    var html = "";

    for (
        var i = 0;
        i < risks.length;
        i++
    ) {

        html +=

            "<tr>" +

            "<td>" +

            "Risk " + (i + 1) +

            "</td>" +

            "<td>" +

            risks[i] +

            "</td>" +

            "</tr>";

    }

    container.innerHTML = html;

}
function renderRiskyDeals() {

    var container =
        document.getElementById(
            "riskyDealsTable"
        );

    var html = "";

    for (
        var i = 0;
        i < pipelineData.length;
        i++
    ) {

        var deal =
            pipelineData[i];

        if (
            deal.Risk ===
            "⚠️ At Risk"
        ) {

            html +=

                "<tr>" +

                "<td>" +
                deal.Company +
                "</td>" +

                "<td>" +
                deal.Stage +
                "</td>" +

                "<td>" +
                deal.Risk +
                "</td>" +

                "<td>" +
                deal.Score +
                "</td>" +

                "</tr>";

        }

    }

    container.innerHTML = html;

}
// ==========================================
// STRATEGIC INSIGHT
// ==========================================

function updateStrategicInsight() {

    var highPriority =
        pipelineData.filter(function(row) {

            return row.Priority === "🔥 High";

        }).length;

    var insight =

        "Pipeline shows " +

        highPriority +

        " high-priority opportunities with strong " +

        "WhatsApp-assisted GTM potential in " +

        "high-engagement regions.";

    document.getElementById(
        "strategicInsight"
    ).innerHTML = insight;

}

// ==========================================
// KPI UPDATES
// ==========================================

function updateKPIs() {

    var totalPipeline = 0;

    var highPriority = 0;

    var atRisk = 0;

    var totalScore = 0;

    for (var i = 0; i < pipelineData.length; i++) {

        var row = pipelineData[i];

        totalPipeline +=
            parseInt(row.Deal_Size || 0);

        totalScore += row.Score;

        if (row.Priority === "🔥 High") {

            highPriority++;

        }

        if (row.Risk === "⚠️ At Risk") {

            atRisk++;

        }

    }

    var avgScore = Math.round(
        totalScore / pipelineData.length
    );

    var health = "Healthy";

    if (atRisk > 5) {

        health = "Moderate Risk";

    }

    if (atRisk > 10) {

        health = "High Risk";

    }

    var kpis =
        document.querySelectorAll(
            ".kpi-value"
        );

    kpis[0].innerHTML =
        "$" +
        totalPipeline.toLocaleString();

    kpis[1].innerHTML =
        highPriority;

    kpis[2].innerHTML =
        atRisk;

    kpis[3].innerHTML =
        avgScore;

    kpis[4].innerHTML =
        health;

}

// ==========================================
// AI FORMATTING
// ==========================================

function formatAIResponse(text) {

    text = text.replace(

        /## Risk Assessment/g,

        "<h3>⚠️ Risk Assessment</h3>"

    );

    text = text.replace(

        /## Recommended Actions/g,

        "<h3>🚀 Recommended Actions</h3>"

    );

    text = text.replace(

        /## Executive Insight/g,

        "<h3>🧠 Executive Insight</h3>"

    );

    text = text.replace(

        /- /g,

        "<br>• "

    );

    text = text.replace(

        /\n/g,

        "<br>"

    );

    return text;

}

// ==========================================
// OPENAI ANALYSIS
// ==========================================

function renderActions(actions) {

    var container =
        document.getElementById(
            "actionInsights"
        );

    var html = "";

    for (
        var i = 0;
        i < actions.length;
        i++
    ) {

        html +=

            "<li>" +
            actions[i] +
            "</li>";

    }

    container.innerHTML = html;

}
async function analyzePipeline() {

    if (pipelineData.length === 0) {

        alert(
            "Please upload a CSV first."
        );

        return;

    }

    summaryText.innerHTML =
        "Generating AI insights...";

    try {

        var response = await fetch(

            "https://funnel-triage-backend.onrender.com/analyze",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                    "application/json"

                },

                body: JSON.stringify({

                    pipeline:
                    pipelineData

                })

            }

        );

        var result =
            await response.json();

        if (result.success) {

    // =========================
    // STRATEGIC INSIGHT
    // =========================

    document.getElementById(
        "strategicInsight"
    ).innerHTML =

        result.strategic_insight;

    // =========================
    // EXECUTIVE INSIGHT
    // =========================

    summaryText.innerHTML =

        result.executive_insight;

    // =========================
    // RISKS
    // =========================

    renderRisks(
        result.risks
    );

    // =========================
    // ACTIONS
    // =========================

    renderActions(
        result.actions
    );
renderRiskyDeals();
}
        else {

            summaryText.innerHTML =

                "Backend error: " +

                result.error;

        }

    }
    catch (error) {

        summaryText.innerHTML =

            "Connection error: " +

            error;

    }

}
// ==========================================
// TABS
// ==========================================

var tabButtons =
    document.querySelectorAll(
        ".tab-button"
    );

var tabContents =
    document.querySelectorAll(
        ".tab-content"
    );

for (
    var i = 0;
    i < tabButtons.length;
    i++
) {

    tabButtons[i]
    .addEventListener(
        "click",
        function() {

            for (
                var j = 0;
                j < tabButtons.length;
                j++
            ) {

                tabButtons[j]
                .classList.remove(
                    "active"
                );

            }

            for (
                var k = 0;
                k < tabContents.length;
                k++
            ) {

                tabContents[k]
                .classList.remove(
                    "active-tab"
                );

            }

            this.classList.add(
                "active"
            );

            var selectedTab =
                this.getAttribute(
                    "data-tab"
                );

            document
                .getElementById(
                    selectedTab
                )
                .classList.add(
                    "active-tab"
                );

        }

    );

}
loadCRMDeals();