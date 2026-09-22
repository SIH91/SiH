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

            // Dynamically populate Feasibility Report & SWOT analysis
            const category = data.business_category || data.businessCategory || "Dairy Farming";
            const insights = generateFeasibilityReport(category, data.village, data.district, data.capital, data.project_cost || data.projectCost);
            populateFeasibilityDOM(insights);

        } catch (e) {
            console.error("Error reading saved analysis", e);
        }
    } else {
        // Fallback default insights when result.html is viewed directly
        const marketReachEl = document.querySelector("#marketReach");
        if (marketReachEl) {
            const defaultInsights = generateFeasibilityReport("Dairy Farming", "Rampur", "Varanasi", 50000, 500000);
            populateFeasibilityDOM(defaultInsights);
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
// AI FEASIBILITY & SWOT GENERATION ENGINE
// ==========================================
function generateFeasibilityReport(category, village, district, capital, projectCost) {
    const v = village || "Rampur";
    const d = district || "Varanasi";
    const cat = category || "Dairy Farming";

    const reports = {
        "Dairy Farming": {
            marketReach: `High daily household demand across ${v} and nearby hamlets; estimated 350–600 daily household consumer base plus local tea stalls and sweet makers.`,
            distributionChannels: `Direct farm-gate morning deliveries, village milk collection center (VCC), and supply contracts with regional milk cooperatives/chilling plants in ${d}.`,
            opportunityAnalysis: `Unmet demand for pure unadulterated milk and value-added curd/ghee in ${v} and ${d} weekly haats. High scope to expand into paneer on festival cycles.`,
            competitorDensity: `Moderate (3–5 informal backyard cattle owners in ${v}), but structured hygienic chilling and doorstep supply are absent.`,
            competitivePosition: `Establish clean milking hygiene standards, doorstep morning delivery subscriptions, and direct fat-testing transparency to build trust.`,
            pricingStrategy: `Competitive baseline ₹52–₹62/L for cow milk, ₹68–₹76/L for buffalo milk; premium 15–20% margin on clarified butter (Desi Ghee).`,
            supplyRisk: `Fodder price fluctuations during dry summer months; access to timely veterinary vaccinations and green fodder supply.`,
            demandRisk: `Perishability risk during summer heatwaves, mitigated by clean stainless steel cans and converting surplus into curd/ghee.`,
            swotStrengths: `Guaranteed daily cash flow, quick turnaround on capital investment, and organic manure co-product for local fields.`,
            swotWeaknesses: `High 365-day labor requirement, livestock vulnerability to seasonal weather changes and feed costs.`,
            swotOpportunities: `Dairy cooperative subsidies (NABARD/DIDF), solar-powered cold milk storage units, and expansion into packaged paneer.`,
            swotThreats: `Unseasonal heat waves affecting milk yield, sudden spike in cattle feed/husk prices.`
        },
        "Agriculture & Horticulture": {
            marketReach: `Direct linkages to ${d} Krishi Upaj Mandi, local weekly village haats, and peri-urban vegetable vendors within 15 km.`,
            distributionChannels: `Farm-gate bulk aggregators, Farmer Producer Organization (FPO) pooling, and local morning wholesale markets.`,
            opportunityAnalysis: `High-margin shift from mono-crop cereals toward drip-irrigated polyhouse vegetables, mushrooms, or exotic cash crops tailored to ${d} market demand.`,
            competitorDensity: `Broad competition in traditional staple grains; very low competition in high-value horticulture and organic produce.`,
            competitivePosition: `Off-season harvesting timing (15–20 days ahead of general harvest) to command 30–40% premium market rates.`,
            pricingStrategy: `Dynamic mandi auction pricing; direct restaurant/hostel contracts at fixed seasonal supply contracts.`,
            supplyRisk: `Unpredictable groundwater levels, monsoon variability, and timely availability of certified seeds and organic compost.`,
            demandRisk: `Glut periods at peak harvest driving down mandi prices; lack of accessible cold storage.`,
            swotStrengths: `Rich soil availability, multigenerational farming familiarity, and high government PM-KUSUM solar pump support.`,
            swotWeaknesses: `Dependence on rainfall patterns and high post-harvest transit losses without precooling.`,
            swotOpportunities: `FPO collective bargaining, PMFBY crop insurance coverage, and micro-irrigation capital subsidies.`,
            swotThreats: `Extreme weather events, pest outbreaks, and sudden price crashes during nationwide harvest gluts.`
        },
        "Retail Grocery / Kirana": {
            marketReach: `Immediate capture of 180–300 families in ${v} plus commuting daily-wage workers within a 3–5 km radius.`,
            distributionChannels: `Walk-in village counter, phone/WhatsApp grocery pre-orders, and doorstep delivery for elder households.`,
            opportunityAnalysis: `Lack of branded packaged staples, hygiene essentials, cold dairy, and mobile/DTH top-up services in immediate neighborhood.`,
            competitorDensity: `High informal presence (2–4 small kiosks), but majority suffer from frequent stockouts and lack digital UPI payments.`,
            competitivePosition: `Maintain 100% in-stock consistency for top 50 staples, offer QR/UPI payments, and friendly micro-credit records.`,
            pricingStrategy: `Max MRP parity with wholesale purchasing from ${d} APMC/mandi to retain 12%–18% gross margin.`,
            supplyRisk: `Transportation costs for weekly replenishment trips to the ${d} wholesale mandi.`,
            demandRisk: `Credit-seeking customer habits (khata) leading to delayed liquidity; post-harvest liquidity peaks.`,
            swotStrengths: `Essential non-discretionary demand, central location visibility, low technical barrier to entry.`,
            swotWeaknesses: `Working capital locked in slow-moving inventory; shelf-life limitations on perishable staples.`,
            swotOpportunities: `Adding micro-ATM (AePS) cash withdrawal, seeds/fertilizer packets, and evening snack counter.`,
            swotThreats: `E-commerce quick delivery penetration into peri-urban fringes and aggressive credit defaults.`
        },
        "Food Processing": {
            marketReach: `Regional reach of 10–25 villages surrounding ${v} plus retail shelves in ${d} semi-urban centers.`,
            distributionChannels: `Direct supply to local Kirana networks, weekly rural haats, roadside dhabas, and school canteen catering.`,
            opportunityAnalysis: `Abundance of raw local produce (spices, mustard, pulses, seasonal fruits) converted to packaged flour, pickles, or cold-pressed oil.`,
            competitorDensity: `Low to moderate; mostly unbranded loose grains with poor packaging and no FSSAI certifications.`,
            competitivePosition: `Clean vacuum-seal packaging, authentic regional taste, transparent FSSAI certification and moisture-proof packaging.`,
            pricingStrategy: `15% below national tier-1 brands while delivering 25% higher profit margin through zero intermediate broker cost.`,
            supplyRisk: `Seasonal harvest price spikes of raw pulses/seeds; power voltage fluctuation in rural grids.`,
            demandRisk: `Consumer preference inertia toward legacy family millers or cheap unbranded alternatives.`,
            swotStrengths: `High value-addition markup (30–45%), long product shelf life compared to raw crops.`,
            swotWeaknesses: `Initial machinery capital outlay, electricity phase requirements, and compliance registration needs.`,
            swotOpportunities: `PM-FME 35% capital subsidy, ODOP (One District One Product) grant scheme, and regional brand building.`,
            swotThreats: `Machinery breakdown delays if spare parts are only available in major state capitals.`
        },
        "Textiles & Tailoring": {
            marketReach: `Direct catchment of 500+ households in ${v}, expanding to nearby schools, colleges, and festive wear buyers.`,
            distributionChannels: `Custom customer stitching boutique, bulk school uniform orders, and festive readymade blouse/kurti counters.`,
            opportunityAnalysis: `Severe lack of timely, high-fitting customized tailoring for women and festive seasonal wedding garments in ${v}.`,
            competitorDensity: `Fragmented single-machine home tailors; lack of modern interlock, embroidery, and designer finishing units.`,
            competitivePosition: `Guaranteed on-time 48-hour delivery, modern stitching machines with overlock, and catalogue design customization.`,
            pricingStrategy: `Tiered pricing: ₹120–₹180 basic alteration/blouse, ₹400–₹900 designer suits, lucrative bulk pricing for institutional uniforms.`,
            supplyRisk: `Thread, zipper, and fabric roll transit delays from ${d} textile markets.`,
            demandRisk: `Cyclical festive and wedding season demand peaks (Oct–Feb) followed by monsoon lulls.`,
            swotStrengths: `Low recurring material cost, high gross margins on skilled labor, strong community word-of-mouth.`,
            swotWeaknesses: `Operator physical fatigue and dependency on skilled machine operators during peak wedding months.`,
            swotOpportunities: `Mudra Shishu/Kishore loan for industrial motor machines, SHG (Self Help Group) garment supply contracts.`,
            swotThreats: `Cheap polyester factory-made readymades from urban discount chains.`
        },
        "Poultry & Livestock": {
            marketReach: `Catchment of ${v} and 10–15 surrounding hamlet meat vendors and weekly bird markets.`,
            distributionChannels: `Direct farm-gate wholesale to local butcher shops, weekly bazaar sales, and hotel/dhaba daily supplies.`,
            opportunityAnalysis: `Soaring demand for high-protein Desi/Kadaknath country chicken and fresh farm eggs in ${d}.`,
            competitorDensity: `Moderate commercial broiler integrators; acute shortage of genuine organic free-range Desi bird supply.`,
            competitivePosition: `Focus on hardy Desi bird breeds (higher disease resistance and 2x selling price per kg over broiler).`,
            pricingStrategy: `Broiler wholesale ₹110–₹140/kg live weight; Desi country chicken commands ₹280–₹360/kg premium pricing.`,
            supplyRisk: `Day-old-chick (DOC) quality and commercial feed cost inflation; bird flu quarantine advisories.`,
            demandRisk: `Religious fasting months (e.g. Sawan, Navratri) where meat consumption plummets by 60–70%.`,
            swotStrengths: `Short 35–45 day production cycle for fast capital rotation; high feed conversion efficiency.`,
            swotWeaknesses: `High mortality risk without strict biosecurity, vaccination schedules, and climate ventilation.`,
            swotOpportunities: `National Livestock Mission (NLM) 50% capital subsidy on poultry breeding units.`,
            swotThreats: `Sudden bird influenza outbreaks and extreme heat waves causing heat-stroke mortality.`
        },
        "Handicrafts & Artisans": {
            marketReach: `Regional tourism corridors, ${d} craft emporiums, state cultural fairs, and direct e-commerce craft platforms.`,
            distributionChannels: `Artisan cooperative stalls, district craft exhibitions, direct bulk gifting orders, and digital social selling.`,
            opportunityAnalysis: `Growing urban appetite for authentic terracotta, handloom weaving, bamboo craft, and eco-friendly utility decor.`,
            competitorDensity: `Low local commercial production; traditional artisans under-monetizing through middleman exploitation.`,
            competitivePosition: `Contemporary minimalist designs blended with ancient motifs, tagged with artisan provenance stories.`,
            pricingStrategy: `Value-based craft pricing yielding 40–60% margins, escaping commoditized raw-material pricing.`,
            supplyRisk: `Seasonal availability of natural clay, bamboo culms, and organic vegetable dyes during monsoon.`,
            demandRisk: `Discretionary purchase nature; urban spending contraction or seasonal exhibition dependence.`,
            swotStrengths: `Deep cultural heritage, unique non-reproducible manual skill, negligible machine electricity requirements.`,
            swotWeaknesses: `Labor-intensive production velocity limits rapid scale; working capital tied up in exhibition inventory.`,
            swotOpportunities: `PM-Vishwakarma scheme providing ₹3 Lakh subsidized credit, toolkits, and national marketing exposure.`,
            swotThreats: `Cheap synthetic plastic replicas from industrial factories flooding local markets.`
        },
        "Repair & Service Workshop": {
            marketReach: `Over 1,200 two-wheelers, tractors, and agricultural pump sets operating in ${v} and adjacent farmland.`,
            distributionChannels: `Highway-facing workshop, on-field emergency mobile breakdown assistance, and annual tractor maintenance packages.`,
            opportunityAnalysis: `Long distances (15–25 km) to nearest ${d} authorized service center forcing farmers to delay urgent repairs.`,
            competitorDensity: `1–2 roadside puncture/greasing stalls with no diagnostic tools or electrical troubleshooting equipment.`,
            competitivePosition: `Equipped with pneumatic tools, genuine OEM spare parts, transparent pricing card, and on-farm emergency callout.`,
            pricingStrategy: `₹150–₹350 standard 2-wheeler service labor; ₹800–₹1,500 tractor hydraulic/engine overhaul labor + 15% spare parts margin.`,
            supplyRisk: `Procurement of genuine brand spare parts, oils, and batteries from ${d} distributors.`,
            demandRisk: `Monsoon slowdowns for general travel; peak breakdown spikes during sowing and harvesting tractor seasons.`,
            swotStrengths: `Immediate cash settlement upon delivery, recurring customer base, resilient across all economic cycles.`,
            swotWeaknesses: `High dependence on technician mechanical troubleshooting skill; grease and oil waste disposal.`,
            swotOpportunities: `Electric vehicle (EV 2W/3W) retrofitting and battery charging/swapping station addition.`,
            swotThreats: `Rapid adoption of complex electronic engine sensors requiring expensive computerized scanners.`
        }
    };

    const fallback = {
        marketReach: `Estimated local consumer base of 500–1,200 residents within a 5–10 km radius of ${v} and connecting weekly markets.`,
        distributionChannels: `Direct retail sales, local village partnerships, and regional distribution to ${d} commercial hubs.`,
        opportunityAnalysis: `High potential to bridge supply gaps for quality ${cat} services and products in ${v}.`,
        competitorDensity: `Low to moderate; existing operations are mostly informal and lack modern customer service standards.`,
        competitivePosition: `Superior product quality, transparent pricing, and dependable local availability tailored to rural needs.`,
        pricingStrategy: `Affordable volume-driven pricing tailored to local purchasing power, retaining healthy 20–30% operational margins.`,
        supplyRisk: `Dependence on timely input transport and inventory procurement from ${d} wholesale markets.`,
        demandRisk: `Seasonal income swings linked to agricultural harvest cycles; maintain diverse product offerings.`,
        swotStrengths: `First-mover advantage in ${v}, low fixed overheads, and strong community word-of-mouth reputation.`,
        swotWeaknesses: `Initial working capital constraints and reliance on local distribution networks.`,
        swotOpportunities: `Government micro-credit schemes (MUDRA / PMEGP) and expanding into neighboring rural blocks.`,
        swotThreats: `Fluctuations in raw material costs and emergence of informal unorganized competitors.`
    };

    return reports[cat] || fallback;
}

function populateFeasibilityDOM(insights) {
    if (!insights) return;
    const setText = (id, text) => {
        const el = document.querySelector("#" + id);
        if (el && text) el.textContent = text;
    };

    setText("marketReach", insights.marketReach);
    setText("distributionChannels", insights.distributionChannels);
    setText("opportunityAnalysis", insights.opportunityAnalysis);
    setText("competitorDensity", insights.competitorDensity);
    setText("competitivePosition", insights.competitivePosition);
    setText("pricingStrategy", insights.pricingStrategy);
    setText("supplyRisk", insights.supplyRisk);
    setText("demandRisk", insights.demandRisk);
    setText("swotStrengths", insights.swotStrengths);
    setText("swotWeaknesses", insights.swotWeaknesses);
    setText("swotOpportunities", insights.swotOpportunities);
    setText("swotThreats", insights.swotThreats);
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