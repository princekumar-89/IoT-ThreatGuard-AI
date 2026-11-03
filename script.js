(() => {
    "use strict";

    // =========================================================
    // IoT SENTINEL AI - FRONTEND CONTROLLER
    // =========================================================

    const API_BASE_URL = "http://127.0.0.1:8000";

    const $ = (id) => document.getElementById(id);

    // =========================================================
    // STATUS ELEMENTS
    // =========================================================

    const backendStatusText = $("backendStatusText");
    const footerBackendStatus = $("footerBackendStatus");
    const footerModelStatus = $("footerModelStatus");

    // =========================================================
    // FORM
    // =========================================================

    const analysisForm = $("analysisForm");
    const analyzeBtn = $("analyzeDeviceBtn");

    // =========================================================
    // INPUTS
    // =========================================================

    const deviceId = $("deviceId");
    const temperature = $("temperature");
    const humidity = $("humidity");
    const cpuUsage = $("cpuUsage");
    const memoryUsage = $("memoryUsage");
    const networkTraffic = $("networkTraffic");
    const packetRate = $("packetRate");
    const connectionCount = $("connectionCount");
    const latency = $("latency");
    const failedLoginAttempts = $("failedLoginAttempts");
    const dataTransmissionRate = $("dataTransmissionRate");

    // =========================================================
    // RESULT ELEMENTS
    // =========================================================

    const resultStatus = $("resultStatus");
    const resultRisk = $("resultRisk");
    const resultScore = $("resultScore");
    const resultExplanation = $("resultExplanationText");
    const resultCard = $("resultCard");

    // =========================================================
    // ALARM STATE
    // =========================================================

    let alarmActive = false;
    let audioContext = null;
    let alarmTimer = null;

    // =========================================================
    // BACKEND STATUS
    // =========================================================

    async function checkBackend() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/health`
            );

            if (!response.ok) {
                throw new Error("Backend unavailable");
            }

            const data = await response.json();

            console.log("Backend Health:", data);

            if (backendStatusText) {
                backendStatusText.textContent =
                    "BACKEND CONNECTED";
            }

            if (footerBackendStatus) {
                footerBackendStatus.textContent =
                    "Backend: Connected";
            }

            if (footerModelStatus) {

                if (data.model_loaded === true) {

                    footerModelStatus.textContent =
                        "Model: Connected";

                } else {

                    footerModelStatus.textContent =
                        "Model: Not Connected";
                }
            }

        } catch (error) {

            console.error(
                "Backend connection error:",
                error
            );

            if (backendStatusText) {
                backendStatusText.textContent =
                    "BACKEND DISCONNECTED";
            }

            if (footerBackendStatus) {
                footerBackendStatus.textContent =
                    "Backend: Not Connected";
            }

            if (footerModelStatus) {
                footerModelStatus.textContent =
                    "Model: Not Connected";
            }
        }
    }

    // =========================================================
    // NUMBER VALUE
    // =========================================================

    function getNumber(element) {

        if (!element) {
            return 0;
        }

        const value = Number(element.value);

        return Number.isFinite(value)
            ? value
            : 0;
    }

    // =========================================================
    // EMERGENCY ALARM
    // =========================================================

    function playEmergencyAlarm() {

        if (alarmActive) {
            return;
        }

        alarmActive = true;

        console.log("🚨 EMERGENCY ALARM STARTED");

        try {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            function sirenCycle() {

                if (!alarmActive) {
                    return;
                }

                const oscillator =
                    audioContext.createOscillator();

                const gain =
                    audioContext.createGain();

                oscillator.type = "sawtooth";

                oscillator.frequency.setValueAtTime(
                    650,
                    audioContext.currentTime
                );

                oscillator.frequency.linearRampToValueAtTime(
                    1050,
                    audioContext.currentTime + 0.45
                );

                oscillator.frequency.linearRampToValueAtTime(
                    650,
                    audioContext.currentTime + 0.9
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    audioContext.currentTime
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.75,
                    audioContext.currentTime + 0.05
                );

                gain.gain.setValueAtTime(
                    0.75,
                    audioContext.currentTime + 0.75
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    audioContext.currentTime + 0.9
                );

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start();

                oscillator.stop(
                    audioContext.currentTime + 0.95
                );
            }

            sirenCycle();

            alarmTimer = setInterval(
                sirenCycle,
                1000
            );

        } catch (error) {

            console.error(
                "Alarm audio error:",
                error
            );
        }
    }

    // =========================================================
    // STOP ALARM
    // =========================================================

    function stopEmergencyAlarm() {

        alarmActive = false;

        if (alarmTimer) {

            clearInterval(alarmTimer);

            alarmTimer = null;
        }

        if (audioContext) {

            try {
                audioContext.close();
            } catch (error) {
                console.log(error);
            }

            audioContext = null;
        }

        console.log("Alarm stopped");
    }

    // =========================================================
    // CREATE STOP ALARM BUTTON
    // =========================================================

    function createAlarmButton() {

        if ($("stopAlarmBtn")) {
            return;
        }

        const button =
            document.createElement("button");

        button.id = "stopAlarmBtn";

        button.type = "button";

        button.textContent =
            "🛑 STOP EMERGENCY ALARM";

        button.style.position = "fixed";
        button.style.right = "25px";
        button.style.bottom = "25px";
        button.style.zIndex = "99999";
        button.style.padding = "14px 22px";
        button.style.border = "2px solid #ff3333";
        button.style.borderRadius = "10px";
        button.style.background = "#8b0000";
        button.style.color = "white";
        button.style.fontWeight = "800";
        button.style.fontSize = "14px";
        button.style.cursor = "pointer";
        button.style.display = "none";
        button.style.boxShadow =
            "0 0 25px rgba(255,0,0,0.65)";

        button.addEventListener(
            "click",
            () => {

                stopEmergencyAlarm();

                button.style.display =
                    "none";
            }
        );

        document.body.appendChild(button);
    }

    // =========================================================
    // SHOW CRITICAL ALERT
    // =========================================================

    function showCriticalAlert() {

        let alertBox =
            $("criticalAlert");

        if (!alertBox) {

            alertBox =
                document.createElement("div");

            alertBox.id =
                "criticalAlert";

            alertBox.style.position =
                "fixed";

            alertBox.style.top =
                "20px";

            alertBox.style.left =
                "50%";

            alertBox.style.transform =
                "translateX(-50%)";

            alertBox.style.zIndex =
                "99998";

            alertBox.style.padding =
                "16px 28px";

            alertBox.style.borderRadius =
                "12px";

            alertBox.style.background =
                "#8b0000";

            alertBox.style.color =
                "#ffffff";

            alertBox.style.fontWeight =
                "900";

            alertBox.style.fontSize =
                "18px";

            alertBox.style.letterSpacing =
                "1px";

            alertBox.style.boxShadow =
                "0 0 35px rgba(255,0,0,0.75)";

            document.body.appendChild(
                alertBox
            );
        }

        alertBox.textContent =
            "🚨 CRITICAL ALERT — IOT ANOMALY DETECTED";

        alertBox.style.display =
            "block";

        const stopButton =
            $("stopAlarmBtn");

        if (stopButton) {
            stopButton.style.display =
                "block";
        }
    }

    // =========================================================
    // REMOVE CRITICAL ALERT
    // =========================================================

    function removeCriticalAlert() {

        const alertBox =
            $("criticalAlert");

        if (alertBox) {
            alertBox.style.display =
                "none";
        }

        const stopButton =
            $("stopAlarmBtn");

        if (stopButton) {
            stopButton.style.display =
                "none";
        }
    }

    // =========================================================
    // DISPLAY RESULT
    // =========================================================

    function displayResult(result) {

        console.log(
            "AI Analysis Result:",
            result
        );

        const status =
            result.status || "Unknown";

        const risk =
            result.risk_level || "Unknown";

        const score =
            result.anomaly_score ?? 0;

        const explanation =
            result.explanation ||
            "No explanation available.";

        // -----------------------------
        // STATUS
        // -----------------------------

        if (resultStatus) {
            resultStatus.textContent =
                status;
        }

        // -----------------------------
        // RISK
        // -----------------------------

        if (resultRisk) {
            resultRisk.textContent =
                risk;
        }

        // -----------------------------
        // SCORE
        // -----------------------------

        if (resultScore) {

            resultScore.textContent =
                Number(score).toFixed(4);
        }

        // -----------------------------
        // EXPLANATION
        // -----------------------------

        if (resultExplanation) {

            resultExplanation.textContent =
                explanation;
        }

        // -----------------------------
        // RESULT CARD
        // -----------------------------

        if (resultCard) {

            resultCard.classList.remove(
                "normal",
                "warning",
                "danger"
            );

            if (status === "Anomaly") {

                if (risk === "High") {

                    resultCard.classList.add(
                        "danger"
                    );

                } else {

                    resultCard.classList.add(
                        "warning"
                    );
                }

            } else {

                resultCard.classList.add(
                    "normal"
                );
            }
        }

        // =====================================================
        // ALARM LOGIC
        // =====================================================

        if (
            status === "Anomaly" &&
            risk === "High"
        ) {

            showCriticalAlert();

            playEmergencyAlarm();

        } else {

            stopEmergencyAlarm();

            removeCriticalAlert();
        }
    }

    // =========================================================
    // ANALYZE DEVICE
    // =========================================================

    async function analyzeDevice() {

        try {

            if (analyzeBtn) {

                analyzeBtn.disabled =
                    true;

                analyzeBtn.textContent =
                    "ANALYZING...";
            }

            const payload = {

                device_id:
                    deviceId?.value ||
                    "IOT-001",

                temperature:
                    getNumber(temperature),

                humidity:
                    getNumber(humidity),

                cpu_usage:
                    getNumber(cpuUsage),

                memory_usage:
                    getNumber(memoryUsage),

                network_traffic:
                    getNumber(networkTraffic),

                packet_rate:
                    getNumber(packetRate),

                connection_count:
                    getNumber(connectionCount),

                latency:
                    getNumber(latency),

                failed_login_attempts:
                    getNumber(
                        failedLoginAttempts
                    ),

                data_transmission_rate:
                    getNumber(
                        dataTransmissionRate
                    )
            };

            console.log(
                "Sending to FastAPI:",
                payload
            );

            const response =
                await fetch(
                    `${API_BASE_URL}/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            const result =
                await response.json();

            console.log(
                "FastAPI Response:",
                result
            );

            if (!response.ok) {

                let errorMessage =
                    "AI analysis failed.";

                if (result.detail) {

                    errorMessage =
                        typeof result.detail ===
                        "string"
                            ? result.detail
                            : JSON.stringify(
                                result.detail
                            );
                }

                throw new Error(
                    errorMessage
                );
            }

            displayResult(result);

        } catch (error) {

            console.error(
                "AI Analysis Error:",
                error
            );

            alert(
                "AI Analysis Failed:\n\n" +
                error.message
            );

        } finally {

            if (analyzeBtn) {

                analyzeBtn.disabled =
                    false;

                analyzeBtn.textContent =
                    "ANALYZE DEVICE";
            }
        }
    }

    // =========================================================
    // FORM SUBMIT
    // =========================================================

    if (analysisForm) {

        analysisForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                analyzeDevice();
            }
        );

    } else if (analyzeBtn) {

        analyzeBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                analyzeDevice();
            }
        );
    }

    // =========================================================
    // INITIALIZE
    // =========================================================

    createAlarmButton();

    checkBackend();

    // =========================================================
    // AUTO HEALTH CHECK
    // =========================================================

    setInterval(
        checkBackend,
        10000
    );

})();// ============================================================
// IoT SENTINEL AI - DATA GRAPHS ADD-ON
// Existing code is NOT changed.
// ============================================================

(() => {
    "use strict";

    const GRAPH_API = "http://127.0.0.1:8000";

    let iotData = [];

    // ------------------------------------------------------------
    // GET DATA FROM FASTAPI /data
    // ------------------------------------------------------------

    async function loadGraphData() {
        try {
            const response = await fetch(`${GRAPH_API}/data`);

            if (!response.ok) {
                throw new Error("Unable to load IoT data");
            }

            const result = await response.json();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error("Invalid data received from backend");
            }

            iotData = result.data;

            console.log("Graph data loaded:", iotData);

            updateAllGraphs();
            updateDashboardData();

        } catch (error) {
            console.error("Graph data error:", error);
        }
    }

    // ------------------------------------------------------------
    // CANVAS SETUP
    // ------------------------------------------------------------

    function prepareCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            console.warn(`Canvas not found: ${canvasId}`);
            return null;
        }

        const container = canvas.parentElement;

        const width = Math.max(
            container.clientWidth || 500,
            300
        );

        const height = Math.max(
            container.clientHeight || 260,
            220
        );

        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        const ctx = canvas.getContext("2d");

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        return {
            canvas,
            ctx,
            width,
            height
        };
    }

    // ------------------------------------------------------------
    // COMMON LINE GRAPH
    // ------------------------------------------------------------

    function drawLineGraph(
        canvasId,
        datasets,
        labels,
        title
    ) {
        const setup = prepareCanvas(canvasId);

        if (!setup) {
            return;
        }

        const {
            ctx,
            width,
            height
        } = setup;

        ctx.clearRect(0, 0, width, height);

        const padding = {
            left: 55,
            right: 20,
            top: 30,
            bottom: 45
        };

        const graphWidth =
            width -
            padding.left -
            padding.right;

        const graphHeight =
            height -
            padding.top -
            padding.bottom;

        // Background
        ctx.fillStyle = "#08111f";
        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        // Title
        ctx.fillStyle = "#e5f6ff";
        ctx.font = "bold 15px Arial";
        ctx.fillText(
            title,
            15,
            20
        );

        // Find maximum
        let maxValue = 0;

        datasets.forEach(dataset => {
            dataset.values.forEach(value => {
                if (Number(value) > maxValue) {
                    maxValue = Number(value);
                }
            });
        });

        if (maxValue <= 0) {
            maxValue = 1;
        }

        // Grid
        ctx.strokeStyle = "rgba(120,160,190,0.18)";
        ctx.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {

            const y =
                padding.top +
                (graphHeight / 5) * i;

            ctx.beginPath();
            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width - padding.right,
                y
            );

            ctx.stroke();

            const value =
                maxValue -
                (maxValue / 5) * i;

            ctx.fillStyle = "#7f9bad";
            ctx.font = "11px Arial";

            ctx.fillText(
                value.toFixed(0),
                8,
                y + 4
            );
        }

        // X-axis labels
        labels.forEach((label, index) => {

            if (labels.length === 0) {
                return;
            }

            const x =
                padding.left +
                (graphWidth /
                    Math.max(labels.length - 1, 1)) *
                    index;

            ctx.fillStyle = "#7f9bad";
            ctx.font = "10px Arial";

            ctx.save();

            ctx.translate(
                x,
                height - 15
            );

            ctx.rotate(-0.35);

            ctx.fillText(
                label,
                0,
                0
            );

            ctx.restore();
        });

        // Lines
        datasets.forEach(dataset => {

            const values =
                dataset.values;

            if (!values.length) {
                return;
            }

            ctx.beginPath();

            values.forEach(
                (value, index) => {

                    const x =
                        padding.left +
                        (graphWidth /
                            Math.max(
                                values.length - 1,
                                1
                            )) *
                            index;

                    const y =
                        padding.top +
                        graphHeight -
                        (Number(value) /
                            maxValue) *
                            graphHeight;

                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            );

            ctx.strokeStyle =
                dataset.color;

            ctx.lineWidth = 2.5;

            ctx.stroke();

            // Points
            values.forEach(
                (value, index) => {

                    const x =
                        padding.left +
                        (graphWidth /
                            Math.max(
                                values.length - 1,
                                1
                            )) *
                            index;

                    const y =
                        padding.top +
                        graphHeight -
                        (Number(value) /
                            maxValue) *
                            graphHeight;

                    ctx.beginPath();

                    ctx.arc(
                        x,
                        y,
                        3,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle =
                        dataset.color;

                    ctx.fill();
                }
            );
        });

        // Legend
        let legendX = 65;

        datasets.forEach(dataset => {

            ctx.fillStyle =
                dataset.color;

            ctx.fillRect(
                legendX,
                height - 35,
                10,
                10
            );

            ctx.fillStyle = "#c8d9e5";
            ctx.font = "11px Arial";

            ctx.fillText(
                dataset.name,
                legendX + 15,
                height - 26
            );

            legendX +=
                80 +
                dataset.name.length * 5;
        });
    }

    // ------------------------------------------------------------
    // SENSOR TREND
    // Temperature + Humidity + CPU
    // ------------------------------------------------------------

    function drawSensorGraph() {

        const labels =
            iotData.map(row =>
                row.device_id || "Device"
            );

        drawLineGraph(
            "sensorTrendChart",
            [
                {
                    name: "Temperature",
                    values: iotData.map(row =>
                        Number(row.temperature) || 0
                    ),
                    color: "#00e5ff"
                },
                {
                    name: "Humidity",
                    values: iotData.map(row =>
                        Number(row.humidity) || 0
                    ),
                    color: "#4ade80"
                },
                {
                    name: "CPU",
                    values: iotData.map(row =>
                        Number(row.cpu_usage) || 0
                    ),
                    color: "#facc15"
                }
            ],
            labels,
            "Temperature / Humidity / CPU"
        );
    }

    // ------------------------------------------------------------
    // NETWORK GRAPH
    // ------------------------------------------------------------

    function drawNetworkGraph() {

        const labels =
            iotData.map(row =>
                row.device_id || "Device"
            );

        drawLineGraph(
            "networkTrafficChart",
            [
                {
                    name: "Network",
                    values: iotData.map(row =>
                        Number(row.network_traffic) || 0
                    ),
                    color: "#00e5ff"
                },
                {
                    name: "Packet Rate",
                    values: iotData.map(row =>
                        Number(row.packet_rate) || 0
                    ),
                    color: "#ff9f43"
                }
            ],
            labels,
            "Network Traffic"
        );
    }

    // ------------------------------------------------------------
    // STATUS DISTRIBUTION
    // ------------------------------------------------------------

    function drawStatusGraph() {

        const setup =
            prepareCanvas(
                "statusDistributionChart"
            );

        if (!setup) {
            return;
        }

        const {
            ctx,
            width,
            height
        } = setup;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        ctx.fillStyle = "#08111f";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        const counts = {
            Normal: 0,
            Suspicious: 0,
            Anomaly: 0,
            Offline: 0
        };

        iotData.forEach(row => {

            const status =
                String(
                    row.status || ""
                ).toLowerCase();

            if (status === "normal") {
                counts.Normal++;
            } else if (
                status === "suspicious"
            ) {
                counts.Suspicious++;
            } else if (
                status === "anomaly"
            ) {
                counts.Anomaly++;
            } else if (
                status === "offline"
            ) {
                counts.Offline++;
            }
        });

        const total =
            Object.values(counts)
                .reduce(
                    (sum, value) =>
                        sum + value,
                    0
                );

        ctx.fillStyle = "#e5f6ff";
        ctx.font = "bold 15px Arial";

        ctx.fillText(
            "Device Status Distribution",
            15,
            20
        );

        if (total === 0) {
            ctx.fillStyle = "#8fa8b8";
            ctx.font = "14px Arial";

            ctx.fillText(
                "No data available",
                15,
                55
            );

            return;
        }

        const items = [
            {
                name: "Normal",
                value: counts.Normal,
                color: "#22c55e"
            },
            {
                name: "Suspicious",
                value: counts.Suspicious,
                color: "#f59e0b"
            },
            {
                name: "Anomaly",
                value: counts.Anomaly,
                color: "#ef4444"
            },
            {
                name: "Offline",
                value: counts.Offline,
                color: "#64748b"
            }
        ];

        const maxValue =
            Math.max(
                ...items.map(
                    item => item.value
                ),
                1
            );

        const chartLeft = 40;
        const chartBottom =
            height - 45;

        const chartHeight =
            height - 95;

        const barWidth = 45;
        const gap = 28;

        items.forEach(
            (item, index) => {

                const barHeight =
                    (item.value /
                        maxValue) *
                    chartHeight;

                const x =
                    chartLeft +
                    index *
                        (barWidth + gap);

                const y =
                    chartBottom -
                    barHeight;

                ctx.fillStyle =
                    item.color;

                ctx.fillRect(
                    x,
                    y,
                    barWidth,
                    barHeight
                );

                ctx.fillStyle =
                    "#e5f6ff";

                ctx.font =
                    "bold 13px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    item.value,
                    x +
                        barWidth / 2,
                    y - 7
                );

                ctx.font =
                    "10px Arial";

                ctx.fillStyle =
                    "#9db2c1";

                ctx.fillText(
                    item.name,
                    x +
                        barWidth / 2,
                    chartBottom + 18
                );
            }
        );

        ctx.textAlign = "left";
    }

    // ------------------------------------------------------------
    // ANOMALY HISTORY
    // ------------------------------------------------------------

    function drawAnomalyGraph() {

        const labels =
            iotData.map(row =>
                row.device_id || "Device"
            );

        const anomalyValues =
            iotData.map(row => {

                const status =
                    String(
                        row.status || ""
                    ).toLowerCase();

                return (
                    status === "anomaly" ||
                    status === "suspicious"
                )
                    ? 1
                    : 0;
            });

        const threshold =
            iotData.map(() => 1);

        drawLineGraph(
            "anomalyHistoryChart",
            [
                {
                    name: "Anomalies",
                    values: anomalyValues,
                    color: "#ef4444"
                },
                {
                    name: "Threshold",
                    values: threshold,
                    color: "#f59e0b"
                }
            ],
            labels,
            "Anomaly History"
        );
    }

    // ------------------------------------------------------------
    // UPDATE ALL GRAPHS
    // ------------------------------------------------------------

    function updateAllGraphs() {

        if (!iotData.length) {
            console.warn(
                "No IoT data available for graphs."
            );
            return;
        }

        drawSensorGraph();
        drawNetworkGraph();
        drawStatusGraph();
        drawAnomalyGraph();

        const note =
            document.getElementById(
                "chartsNote"
            );

        if (note) {
            note.textContent =
                `Live data loaded from FastAPI /data — ${iotData.length} records`;
        }
    }

    // ------------------------------------------------------------
    // UPDATE KPI VALUES
    // ------------------------------------------------------------

    function updateDashboardData() {

        if (!iotData.length) {
            return;
        }

        const total =
            iotData.length;

        const normal =
            iotData.filter(row =>
                String(
                    row.status || ""
                ).toLowerCase() ===
                "normal"
            ).length;

        const anomalies =
            iotData.filter(row => {

                const status =
                    String(
                        row.status || ""
                    ).toLowerCase();

                return (
                    status === "anomaly" ||
                    status === "suspicious"
                );
            }).length;

        const totalElement =
            document.getElementById(
                "totalDevicesValue"
            );

        const normalElement =
            document.getElementById(
                "normalDevicesValue"
            );

        const anomalyElement =
            document.getElementById(
                "anomaliesValue"
            );

        if (totalElement) {
            totalElement.textContent =
                total;
        }

        if (normalElement) {
            normalElement.textContent =
                normal;
        }

        if (anomalyElement) {
            anomalyElement.textContent =
                anomalies;
        }

        console.log(
            "Dashboard updated:",
            {
                total,
                normal,
                anomalies
            }
        );
    }

    // ------------------------------------------------------------
    // REFRESH GRAPH DATA
    // ------------------------------------------------------------

    async function refreshGraphs() {
        await loadGraphData();
    }

    // ------------------------------------------------------------
    // INITIAL LOAD
    // ------------------------------------------------------------

    function initializeGraphs() {

        console.log(
            "IoT Sentinel AI graphs initializing..."
        );

        loadGraphData();

        // Refresh every 10 seconds
        setInterval(
            refreshGraphs,
            10000
        );
    }

    // Wait until page is ready
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeGraphs
        );

    } else {

        initializeGraphs();
    }

    // ------------------------------------------------------------
    // REDRAW WHEN WINDOW SIZE CHANGES
    // ------------------------------------------------------------

    window.addEventListener(
        "resize",
        () => {

            if (iotData.length) {
                updateAllGraphs();
            }

        }
    );

})();// ============================================================
// CLEAR INPUT BUTTON ADD-ON
// Existing code is NOT changed.
// ============================================================

(() => {
    "use strict";

    function setupClearInput() {

        // Clear button ko uske text se find karega
        const buttons = Array.from(
            document.querySelectorAll("button")
        );

        const clearButton = buttons.find(button => {
            const text = (button.textContent || "")
                .trim()
                .toLowerCase();

            return (
                text.includes("clear input") ||
                text.includes("clear")
            );
        });

        if (!clearButton) {
            console.warn("CLEAR INPUT button not found.");
            return;
        }

        // Duplicate event avoid karne ke liye
        if (clearButton.dataset.clearHandlerAdded === "true") {
            return;
        }

        clearButton.dataset.clearHandlerAdded = "true";

        clearButton.addEventListener("click", function (event) {

            event.preventDefault();

            // Current HTML IDs
            const currentInputIds = [
                "inputDeviceId",
                "inputTemperature",
                "inputHumidity",
                "inputCpuUsage",
                "inputMemoryUsage",
                "inputNetworkTraffic",
                "inputPacketRate",
                "inputConnectionCount",
                "inputLatency",
                "inputFailedLogins",
                "inputDataRate"
            ];

            // Old IDs bhi support karenge
            const oldInputIds = [
                "deviceId",
                "temperature",
                "humidity",
                "cpuUsage",
                "memoryUsage",
                "networkTraffic",
                "packetRate",
                "connectionCount",
                "latency",
                "failedLoginAttempts",
                "dataTransmissionRate"
            ];

            // Saare input fields clear
            [
                ...currentInputIds,
                ...oldInputIds
            ].forEach(id => {

                const element = document.getElementById(id);

                if (element) {
                    element.value = "";
                }

            });

            // Result bhi clear
            const resultStatus =
                document.getElementById("resultStatus");

            const resultRisk =
                document.getElementById("resultRisk");

            const resultScore =
                document.getElementById("resultScore");

            const resultExplanation =
                document.getElementById("resultExplanationText");

            if (resultStatus) {
                resultStatus.textContent = "—";
            }

            if (resultRisk) {
                resultRisk.textContent = "—";
            }

            if (resultScore) {
                resultScore.textContent = "—";
            }

            if (resultExplanation) {
                resultExplanation.textContent =
                    "Enter device values and run AI analysis.";
            }

            console.log("CLEAR INPUT: All fields cleared.");

        });
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            setupClearInput
        );

    } else {

        setupClearInput();

    }

})();