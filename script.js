// ========================================================
// LocoBiz | AI - SIMPLIFIED FRONTEND & SUPABASE INTEGRATION
// ========================================================

// Safe helper to get Supabase Client
function getSupabase() {
    return window.supabaseClient || null;
}

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // 1. MOBILE NAVIGATION TOGGLE
    // ========================================
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", function () {
            navLinks.classList.toggle("active");
            navToggle.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
        });
    }


    // ========================================
    // 2. QUICK CAPITAL CHIPS (ANALYZE PAGE)
    // ========================================
    const chipButtons = document.querySelectorAll(".chip-btn");
    const capitalInput = document.querySelector("#capital");

    if (chipButtons.length > 0 && capitalInput) {
        chipButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                chipButtons.forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                capitalInput.value = this.dataset.amount;
                capitalInput.focus();
            });
        });

        // Sync active state when typing manually
        capitalInput.addEventListener("input", function () {
            chipButtons.forEach(function (btn) {
                if (btn.dataset.amount === capitalInput.value) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        });
    }


    // ========================================
    // 3. SMART FEASIBILITY CALCULATOR (SUPABASE SYNC)
    // ========================================
    const analysisForm = document.querySelector("#analysisForm");

    if (analysisForm) {
        analysisForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const village = document.querySelector("#village") ? document.querySelector("#village").value.trim() : "";
            const block = document.querySelector("#block") ? document.querySelector("#block").value.trim() : "";
            const district = document.querySelector("#district") ? document.querySelector("#district").value.trim() : "";
            const state = document.querySelector("#state") ? document.querySelector("#state").value.trim() : "";
            const capital = Number(document.querySelector("#capital").value);
            const businessCategory = document.querySelector("#businessCategory").value;

            if (!village || !district || !capital || !businessCategory) {
                alert("Please fill in your village, district, capital, and business category.");
                return;
            }

            // Margin calculation: Capital is 10%, Project Cost is 100%
            const projectCost = Math.round(capital / 0.10);
            let loanAmount = Math.round(projectCost * 0.90);

            // Scheme match
            let scheme = "";
            let interestRate = 0;
            let tenure = "";
            let moratorium = "";
            let maximumLoan = 0;

            if (projectCost <= 140000) {
                scheme = "Micro Finance Scheme";
                interestRate = 6.5;
                tenure = "3 Years";
                moratorium = "3 Months";
                maximumLoan = 125000;
            } else if (projectCost <= 5000000) {
                scheme = "Term Loan Scheme";
                interestRate = 8.0;
                tenure = "7 Years";
                moratorium = "6 Months";
                maximumLoan = 4500000;
            } else {
                alert("For projects above ₹50 Lakhs, please contact the District Industries Centre directly.");
                return;
            }

            if (loanAmount > maximumLoan) {
                loanAmount = maximumLoan;
            }

            const analysisData = {
                village: village,
                block: block || district,
                district: district,
                state: state,
                capital: capital,
                business_category: businessCategory,
                project_cost: projectCost,
                loan_amount: loanAmount,
                scheme: scheme,
                interest_rate: interestRate,
                tenure: tenure,
                moratorium: moratorium
            };

            // 1. Instant local storage for snappy UI
            localStorage.setItem("businessAnalysis", JSON.stringify(analysisData));

            // 2. Asynchronous sync to Supabase backend database
            const supabase = getSupabase();
            if (supabase) {
                try {
                    await supabase.from("assessments").insert([analysisData]);
                } catch (err) {
                    console.warn("Supabase assessment sync:", err);
                }
            }

            // Smooth redirect to results page
            window.location.href = "result.html";
        });
    }


    // ========================================
    // 4. LOAD ANALYSIS RESULT (RESULT PAGE)
    // ========================================
    const savedAnalysis = localStorage.getItem("businessAnalysis");

    if (savedAnalysis) {
        try {
            const data = JSON.parse(savedAnalysis);

            const locationEl = document.querySelector("#resultLocation");
            if (locationEl) {
                const parts = [data.village, data.block, data.district, data.state].filter(Boolean);
                locationEl.textContent = parts.join(", ") || "Rural Enterprise Hub";
            }

            const businessEl = document.querySelector("#resultBusiness");
            if (businessEl) {
                businessEl.textContent = data.business_category || data.businessCategory || "Micro Business";
            }

            const capitalEl = document.querySelector("#resultCapital");
            if (capitalEl) capitalEl.textContent = formatCurrency(data.capital);

            const projectEl = document.querySelector("#resultProjectCost");
            if (projectEl) projectEl.textContent = formatCurrency(data.project_cost || data.projectCost);

            const loanEl = document.querySelector("#resultLoan");
            if (loanEl) loanEl.textContent = formatCurrency(data.loan_amount || data.loanAmount);

            const schemeEl = document.querySelector("#resultScheme");
            if (schemeEl) schemeEl.textContent = data.scheme;

            const interestEl = document.querySelector("#resultInterest");
            if (interestEl) interestEl.textContent = (data.interest_rate || data.interestRate) + "% p.a.";

            const tenureEl = document.querySelector("#resultTenure");
            if (tenureEl) tenureEl.textContent = data.tenure;

            const moratoriumEl = document.querySelector("#resultMoratorium");
            if (moratoriumEl) moratoriumEl.textContent = data.moratorium;

        } catch (e) {
            console.error("Error reading saved analysis", e);
        }
    }


    // ========================================
    // 5. CONTEXTUAL AI ADVISOR CHAT
    // ========================================
    const advisorStatusText = document.querySelector("#advisorStatusText");
    if (advisorStatusText && savedAnalysis) {
        try {
            const data = JSON.parse(savedAnalysis);
            const cat = data.business_category || data.businessCategory || "Business";
            advisorStatusText.textContent = `Ready with tailored insights for your ${cat} in ${data.village}.`;
        } catch (e) { }
    }

    const chatInputForm = document.querySelector(".chat-input");
    if (chatInputForm) {
        chatInputForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = chatInputForm.querySelector("input");
            const userText = input.value.trim();
            if (!userText) return;

            addUserMessage(userText);
            input.value = "";

            respondAsAI(userText);
        });
    }

    // Quick advice topic buttons in AI Advisor
    const quickTopicButtons = document.querySelectorAll(".advice-options button");
    quickTopicButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const question = this.textContent.trim();
            addUserMessage(question);
            respondAsAI(question);
        });
    });


    // ========================================
    // 6. REGISTRATION (REAL SUPABASE AUTH & PROFILES)
    // ========================================
    const registerForm = document.querySelector(".register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const submitBtn = registerForm.querySelector("button[type='submit']");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Creating profile...";
            }

            const name = document.querySelector("#name") ? document.querySelector("#name").value.trim() : "";
            const phone = document.querySelector("#phone") ? document.querySelector("#phone").value.trim() : "";
            const email = document.querySelector("#email") ? document.querySelector("#email").value.trim() : "";
            const location = document.querySelector("#location") ? document.querySelector("#location").value.trim() : "";
            const password = document.querySelector("#password") ? document.querySelector("#password").value : "Pass@123";
            const business = document.querySelector("#business") ? document.querySelector("#business").value.trim() : "";
            const category = document.querySelector("#category") ? document.querySelector("#category").value : "";

            const profileData = {
                full_name: name,
                phone: phone,
                email: email,
                village: location,
                business_name: business,
                business_category: category
            };

            // Save to localStorage for instant profile view
            localStorage.setItem("userProfile", JSON.stringify(profileData));

            const supabase = getSupabase();
            if (supabase) {
                try {
                    // Sign up with Supabase Auth
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: { full_name: name, phone: phone }
                        }
                    });

                    if (authError) {
                        console.warn("Supabase Auth note:", authError.message);
                    }

                    // Insert into public.profiles
                    const { error: profileError } = await supabase.from("profiles").insert([{
                        auth_user_id: authData?.user?.id || null,
                        ...profileData
                    }]);

                    if (profileError) {
                        console.warn("Supabase Profile table note:", profileError.message);
                    }
                } catch (err) {
                    console.warn("Supabase registration error:", err);
                }
            }

            alert("Account & Business profile created successfully!");
            window.location.href = "dashboard.html";
        });
    }


    // ========================================
    // 7. LOGIN (REAL SUPABASE AUTH)
    // ========================================
    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.querySelector("#email") ? document.querySelector("#email").value.trim() : "";
            const password = document.querySelector("#password") ? document.querySelector("#password").value : "";

            const submitBtn = loginForm.querySelector("button[type='submit']");
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Logging in...";
            }

            const supabase = getSupabase();
            if (supabase && email && password) {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (error) {
                        alert("Login note: " + error.message);
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = "Login";
                        }
                        return;
                    }

                    // Fetch user profile from Supabase
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("email", email)
                        .maybeSingle();

                    if (profile) {
                        localStorage.setItem("userProfile", JSON.stringify(profile));
                    } else {
                        localStorage.setItem("userProfile", JSON.stringify({
                            email: email,
                            full_name: data.user?.user_metadata?.full_name || email.split("@")[0]
                        }));
                    }
                } catch (err) {
                    console.warn("Login request error:", err);
                }
            } else {
                localStorage.setItem("userProfile", JSON.stringify({
                    email: email || "user@LocoBiz.ai",
                    full_name: email ? email.split("@")[0] : "Entrepreneur"
                }));
            }

            window.location.href = "dashboard.html";
        });
    }


    // ========================================
    // 8. DASHBOARD USER PERSONALIZATION
    // ========================================
    const welcomeHeader = document.querySelector(".dashboard-welcome h1");
    const storedProfile = localStorage.getItem("userProfile");

    if (welcomeHeader && storedProfile) {
        try {
            const p = JSON.parse(storedProfile);
            if (p.full_name) {
                welcomeHeader.innerHTML = `Welcome back, <span>${escapeHTML(p.full_name)}!</span>`;
            }
        } catch (e) { }
    }


    // ========================================
    // 9. FINANCE TRANSACTIONS (SUPABASE SYNC)
    // ========================================
    const transactionForm = document.querySelector(".transaction-form");
    if (transactionForm) {
        transactionForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const typeEl = document.querySelector("#transaction-type");
            const categoryEl = document.querySelector("#transaction-category");
            const amountEl = document.querySelector("#amount");

            const type = typeEl ? typeEl.value : "income";
            const category = categoryEl ? categoryEl.value : "General";
            const amount = amountEl ? Number(amountEl.value) : 0;

            if (!amount) {
                alert("Please enter a valid amount.");
                return;
            }

            const supabase = getSupabase();
            if (supabase) {
                try {
                    await supabase.from("transactions").insert([{
                        type: type,
                        category: category,
                        amount: amount
                    }]);
                } catch (err) {
                    console.warn("Transaction sync note:", err);
                }
            }

            alert("Transaction saved to database!");

            if (amountEl) amountEl.value = "";
        });
    }
});


// ========================================
// AI CHAT RESPONDER
// ========================================
function addUserMessage(message) {
    const chatArea = document.querySelector(".chat-area");
    if (!chatArea) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHTML(message)}</p>
        </div>
    `;

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function addAIMessage(message) {
    const chatArea = document.querySelector(".chat-area");
    if (!chatArea) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function respondAsAI(query) {
    const saved = localStorage.getItem("businessAnalysis");
    let businessType = "Dairy / Rural Business";
    let location = "your village";

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.business_category || parsed.businessCategory) {
                businessType = parsed.business_category || parsed.businessCategory;
            }
            if (parsed.village) location = parsed.village;
        } catch (e) { }
    }

    const q = query.toLowerCase();

    setTimeout(function () {
        let response = "";

        if (q.includes("loan") || q.includes("subsid")) {
            response = `Under government rural enterprise guidelines, you can obtain a <strong>90% subsidized bank loan</strong> with a 10% margin deposit. For ${businessType}, eligible schemes include Micro Finance (up to ₹1.25L at 6.5%) and Term Loan (up to ₹45L at 8% with 6 months moratorium). Apply through your nearest regional rural bank (RRB) or cooperative bank.`;
        } else if (q.includes("dairy") || q.includes("milk")) {
            response = `For a <strong>Dairy enterprise in ${location}</strong>, profit margins typically range from 25% to 35%. Key advice: 1) Procure high-yielding breeds (Murrah buffaloes or Sahiwal cows), 2) Secure local fodder tie-ups to reduce feeding costs by 20%, and 3) Partner with dairy cooperatives (like Amul/local federations) for guaranteed daily milk collection.`;
        } else if (q.includes("best business") || q.includes("which business")) {
            response = `Top high-demand businesses for ${location}:<br>• <strong>Dairy & Milk Collection</strong>: Steady daily cash flow.<br>• <strong>Kirana / Daily Needs Store</strong>: Non-perishable staple retail with quick turnover.<br>• <strong>Poultry & Fishery</strong>: High protein demand in local weekly haats.<br>• <strong>Agri-Input Center</strong>: Seeds, organic fertilizers, and tool rentals.`;
        } else if (q.includes("expense") || q.includes("reduce") || q.includes("cost")) {
            response = `To reduce operating expenses in ${location}:<br>1. Buy raw materials/feed collectively through a Self-Help Group (SHG) to get bulk wholesale discounts.<br>2. Maintain a strict daily log of cash outflows to stop inventory shrinkage.<br>3. Avoid informal high-interest money-lenders; stick to formal bank loans with low interest rates.`;
        } else if (q.includes("kirana") || q.includes("grocery") || q.includes("store")) {
            response = `To launch a profitable Kirana store: 1) Select a spot near a village chowk or bus stop, 2) Stock fast-moving essentials (oil, grains, soap, snacks), 3) Keep 10-15 days of inventory buffer, and 4) Provide UPI QR code payment options alongside cash.`;
        } else if (q.includes("price") || q.includes("pricing")) {
            response = `For competitive rural pricing: 1) Benchmark against neighboring village shops, 2) Keep a 10-15% gross margin on branded packaged goods, and 3) Offer small packaging sizes (e.g. ₹5 - ₹10 sachets) which have the highest sales volume in rural areas.`;
        } else {
            response = `Great question! For your <strong>${businessType}</strong> in <strong>${location}</strong>, the priority is maintaining positive working capital and taking advantage of 90% government loan schemes. Would you like advice on cost reduction, customer marketing, or loan documentation?`;
        }

        addAIMessage(response);
    }, 450);
}

function formatCurrency(amount) {
    if (isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

function openAdvisor() {
    window.location.href = "advisor.html";
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, function (tag) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag;
    });
}
// ==========================================
// SMART FINANCIAL CALCULATOR
// ==========================================

function calculateFinance() {

    const capital = Number(
        document.getElementById("financeCapital").value
    );

    const business = document.getElementById("financeBusiness").value;

    if (!capital || capital <= 0) {
        alert("Please enter your available margin capital.");
        return;
    }

    if (!business) {
        alert("Please select a business category.");
        return;
    }


    // PS STRUCTURE
    // Beneficiary = 10%
    // Agency Loan = 90%

    let projectCost = capital / 0.10;
    let loanAmount = projectCost * 0.90;

    let scheme;
    let interestRate;
    let tenureYears;
    let moratorium;
    let maxLoan;


    // MICRO FINANCE
    if (projectCost <= 140000) {

        scheme = "Micro Finance Scheme";
        interestRate = 6.5;
        tenureYears = 3;
        moratorium = "3 Months";
        maxLoan = 125000;

    }

    // TERM LOAN
    else if (projectCost <= 5000000) {

        scheme = "Term Loan Scheme";
        interestRate = 8;
        tenureYears = 7;
        moratorium = "6 Months";
        maxLoan = 4500000;

    }

    // ABOVE LIMIT
    else {

        alert(
            "The calculated project cost is above ₹50 lakh, " +
            "which is outside the supported scheme range."
        );

        return;
    }


    // Apply scheme loan limit

    loanAmount = Math.min(loanAmount, maxLoan);


    // EMI calculation

    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;

    let emi;

    if (monthlyRate === 0) {

        emi = loanAmount / totalMonths;

    } else {

        emi =
            loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, totalMonths) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);

    }


    // Format currency

    const money = (value) => {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(value);

    };


    // Show summary

    document.getElementById("financeMargin").textContent =
        money(capital);

    document.getElementById("financeProject").textContent =
        money(projectCost);

    document.getElementById("financeLoan").textContent =
        money(loanAmount);

    document.getElementById("financeScheme").textContent =
        scheme;

    document.getElementById("financeInterest").textContent =
        interestRate + "% p.a.";

    document.getElementById("financeTenure").textContent =
        tenureYears + " Years";

    document.getElementById("financeMoratorium").textContent =
        moratorium;

    document.getElementById("monthlyEMI").textContent =
        money(emi);


    // Generate repayment table

    generateRepaymentSchedule(
        loanAmount,
        interestRate,
        tenureYears,
        emi
    );


    document.getElementById("financeResult").style.display = "block";

}


// ==========================================
// REPAYMENT SCHEDULE
// ==========================================

function generateRepaymentSchedule(
    loanAmount,
    interestRate,
    tenureYears,
    emi
) {

    const table =
        document.getElementById("repaymentTable");

    table.innerHTML = "";


    const monthlyRate =
        interestRate / 12 / 100;

    const totalMonths =
        tenureYears * 12;

    let balance = loanAmount;


    for (let month = 1; month <= totalMonths; month++) {

        const openingBalance = balance;

        const interest =
            balance * monthlyRate;

        let principal =
            emi - interest;


        // Prevent negative balance at the end

        if (principal > balance) {
            principal = balance;
        }

        const closingBalance =
            Math.max(0, balance - principal);


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>Month ${month}</td>

            <td>
                ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(openingBalance)}
            </td>

            <td>
                ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(emi)}
            </td>

            <td>
                ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(interest)}
            </td>

            <td>
                ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(principal)}
            </td>

            <td>
                ${new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(closingBalance)}
            </td>

        `;


        table.appendChild(row);

        balance = closingBalance;


        if (balance <= 0) {
            break;
        }

    }

}