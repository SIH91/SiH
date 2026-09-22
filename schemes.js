// =========================================================
// LOCOBIZ | AI — GOVERNMENT SCHEME FINDER
// Scheme Finder frontend logic
// =========================================================


// =========================================================
// SAMPLE SCHEME DATA
// NOTE:
// This is temporary frontend data.
// Later this will come from Python backend + MySQL.
// =========================================================

const schemes = [

    {
        id: "pmegp",

        name: "Prime Minister's Employment Generation Programme (PMEGP)",

        shortDescription:
            "A credit-linked subsidy programme supporting new micro-enterprises and employment generation.",

        description:
            "PMEGP supports eligible entrepreneurs in setting up new micro-enterprises in rural and urban areas.",

        categories: [
            "manufacturing",
            "services",
            "retail"
        ],

        occupations: [
            "entrepreneur",
            "self-employed"
        ],

        areas: [
            "rural",
            "semi-urban",
            "urban"
        ],

        tags: [
            "new",
            "firstBusiness",
            "entrepreneur"
        ],

         officialUrl:
         "https://www.pmegp.msme.gov.in/",

        source:
            "Khadi and Village Industries Commission (KVIC)"
    },


    {
        id: "mudra",

        name: "Pradhan Mantri MUDRA Yojana (PMMY)",

        shortDescription:
            "Credit support for micro enterprises and small business activities.",

        description:
            "PMMY provides institutional credit support to micro and small business activities through participating lending institutions.",

        categories: [
            "agriculture",
            "dairy",
            "food",
            "retail",
            "textiles",
            "manufacturing",
            "services",
            "artisan"
        ],

        occupations: [
            "entrepreneur",
            "self-employed",
            "artisan",
            "farmer"
        ],

        areas: [
            "rural",
            "semi-urban",
            "urban"
        ],

        tags: [
            "new",
            "existing",
            "entrepreneur",
            "farmer",
            "artisan"
        ],

        officialUrl:
            "https://www.mudra.org.in/",

        source:
            "MUDRA"
    },


    {
        id: "pmfme",

        name: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",

        shortDescription:
            "Support for micro food-processing enterprises and formalisation of the food-processing sector.",

        description:
            "PMFME supports eligible micro food-processing enterprises through financial, technical and business support.",

        categories: [
            "food",
            "agriculture"
        ],

        occupations: [
            "entrepreneur",
            "farmer",
            "self-employed"
        ],

        areas: [
            "rural",
            "semi-urban",
            "urban"
        ],

        tags: [
            "new",
            "existing",
            "farmer",
            "entrepreneur"
        ],

        officialUrl:
            "https://pmfme.mofpi.gov.in/",

        source:
            "Ministry of Food Processing Industries"
    },


    {
        id: "agriculture",

        name: "Agriculture & Rural Development Schemes",

        shortDescription:
            "Explore government support relevant to agriculture and rural enterprise activities.",

        description:
            "Government programmes can provide different forms of support for agriculture, rural livelihoods and related enterprise activities.",

        categories: [
            "agriculture",
            "dairy"
        ],

        occupations: [
            "farmer",
            "entrepreneur"
        ],

        areas: [
            "rural"
        ],

        tags: [
            "farmer",
            "rural"
        ],

        officialUrl:
            "https://www.myscheme.gov.in/",

        source:
            "myScheme"
    },


    {
        id: "artisan",

        name: "Artisan & Craftsman Support Schemes",

        shortDescription:
            "Explore government support relevant to artisans and traditional craftspeople.",

        description:
            "Government schemes may provide financial, training, market and enterprise support for eligible artisans and craftspeople.",

        categories: [
            "artisan",
            "textiles"
        ],

        occupations: [
            "artisan",
            "self-employed"
        ],

        areas: [
            "rural",
            "semi-urban",
            "urban"
        ],

        tags: [
            "artisan",
            "existing",
            "new"
        ],

        officialUrl:
            "https://www.myscheme.gov.in/",

        source:
            "myScheme"
    },


    {
        id: "women",

        name: "Women Entrepreneurship Schemes",

        shortDescription:
            "Explore government programmes that may support eligible women entrepreneurs.",

        description:
            "Different government programmes provide financial and enterprise support for eligible women entrepreneurs.",

        categories: [
            "agriculture",
            "dairy",
            "food",
            "retail",
            "textiles",
            "manufacturing",
            "services",
            "artisan"
        ],

        occupations: [
            "entrepreneur",
            "self-employed",
            "artisan",
            "farmer"
        ],

        areas: [
            "rural",
            "semi-urban",
            "urban"
        ],

        tags: [
            "woman",
            "entrepreneur"
        ],

        officialUrl:
            "https://www.myscheme.gov.in/",

        source:
            "myScheme"
    }

];


// =========================================================
// CURRENT STEP
// =========================================================

let currentSchemeStep = 1;


// =========================================================
// GET USER DATA
// =========================================================

function getSchemeUserData() {

    return {

        age:
            Number(
                document.getElementById("schemeAge").value
            ),

        gender:
            document.getElementById("schemeGender").value,

        state:
            document.getElementById("schemeState").value
                .trim()
                .toLowerCase(),

        district:
            document.getElementById("schemeDistrict").value
                .trim()
                .toLowerCase(),

        areaType:
            document.getElementById("schemeAreaType").value,

        occupation:
            document.getElementById("schemeOccupation").value,

        businessStatus:
            document.getElementById("schemeBusinessStatus").value,

        businessCategory:
            document.getElementById("schemeBusinessCategory").value,

        investment:
            Number(
                document.getElementById("schemeInvestment").value
            ),

        businessIdea:
            document.getElementById("schemeBusinessIdea").value
                .trim(),

        farmer:
            document.getElementById("schemeFarmer").checked,

        womanEntrepreneur:
            document.getElementById("schemeWomanEntrepreneur").checked,

        artisan:
            document.getElementById("schemeArtisan").checked,

        shg:
            document.getElementById("schemeSHG").checked,

        fpo:
            document.getElementById("schemeFPO").checked,

        firstBusiness:
            document.getElementById("schemeFirstBusiness").checked
    };
}


// =========================================================
// VALIDATION
// =========================================================

function validateSchemeStep(step) {

    if (step === 1) {

        const age =
            Number(
                document.getElementById("schemeAge").value
            );

        const gender =
            document.getElementById("schemeGender").value;

        const state =
            document.getElementById("schemeState").value.trim();

        const district =
            document.getElementById("schemeDistrict").value.trim();

        const areaType =
            document.getElementById("schemeAreaType").value;


        if (!age || age < 18) {
            alert("Please enter a valid age (18 or above).");
            return false;
        }

        if (!gender) {
            alert("Please select your gender.");
            return false;
        }

        if (!state) {
            alert("Please enter your state.");
            return false;
        }

        if (!district) {
            alert("Please enter your district.");
            return false;
        }

        if (!areaType) {
            alert("Please select your area type.");
            return false;
        }
    }


    if (step === 2) {

        const occupation =
            document.getElementById("schemeOccupation").value;

        const businessStatus =
            document.getElementById("schemeBusinessStatus").value;

        const businessCategory =
            document.getElementById("schemeBusinessCategory").value;

        const investment =
            Number(
                document.getElementById("schemeInvestment").value
            );


        if (!occupation) {
            alert("Please select your occupation.");
            return false;
        }

        if (!businessStatus) {
            alert("Please select your business status.");
            return false;
        }

        if (!businessCategory) {
            alert("Please select your business category.");
            return false;
        }

        if (!investment || investment <= 0) {
            alert("Please enter your expected investment.");
            return false;
        }
    }


    return true;
}


// =========================================================
// NEXT STEP
// =========================================================

function nextSchemeStep(step) {

    if (!validateSchemeStep(step)) {
        return;
    }

    if (step >= 3) {
        return;
    }

    currentSchemeStep = step + 1;

    updateSchemeSteps();
}


// =========================================================
// PREVIOUS STEP
// =========================================================

function previousSchemeStep(step) {

    if (step <= 1) {
        return;
    }

    currentSchemeStep = step - 1;

    updateSchemeSteps();
}


// =========================================================
// UPDATE STEP UI
// =========================================================

function updateSchemeSteps() {

    document
        .querySelectorAll(".scheme-step")
        .forEach((stepElement, index) => {

            const stepNumber = index + 1;

            stepElement.classList.toggle(
                "active",
                stepNumber === currentSchemeStep
            );
        });


    document
        .querySelectorAll(".progress-step")
        .forEach((stepElement, index) => {

            const stepNumber = index + 1;

            stepElement.classList.toggle(
                "active",
                stepNumber === currentSchemeStep
            );

            stepElement.classList.toggle(
                "completed",
                stepNumber < currentSchemeStep
            );
        });
}


// =========================================================
// SCHEME MATCHING
// =========================================================

function matchSchemes(user) {

    const matchedSchemes = schemes.map(scheme => {

        let score = 0;


        // Business category
        if (
            scheme.categories.includes(
                user.businessCategory
            )
        ) {
            score += 30;
        }


        // Occupation
        if (
            scheme.occupations.includes(
                user.occupation
            )
        ) {
            score += 20;
        }


        // Area
        if (
            scheme.areas.includes(
                user.areaType
            )
        ) {
            score += 15;
        }


        // New / existing business
        if (
            scheme.tags.includes(
                user.businessStatus
            )
        ) {
            score += 10;
        }


        // Farmer
        if (
            user.farmer &&
            scheme.tags.includes("farmer")
        ) {
            score += 15;
        }


        // Woman entrepreneur
        if (
            user.womanEntrepreneur &&
            scheme.tags.includes("woman")
        ) {
            score += 20;
        }


        // Artisan
        if (
            user.artisan &&
            scheme.tags.includes("artisan")
        ) {
            score += 15;
        }


        // First business
        if (
            user.firstBusiness &&
            scheme.tags.includes("firstBusiness")
        ) {
            score += 10;
        }


        return {
            ...scheme,
            score
        };

    });


    return matchedSchemes
        .filter(scheme => scheme.score > 0)
        .sort(
            (a, b) => b.score - a.score
        );
}


// =========================================================
// FIND SCHEMES
// =========================================================

function findSchemes() {

    const user =
        getSchemeUserData();


    // Save user information locally for now.
    // Later this will be sent to the Python backend.
    localStorage.setItem(
        "locoBizSchemeUser",
        JSON.stringify(user)
    );


    const matchedSchemes =
        matchSchemes(user);


    displaySchemeResults(
        matchedSchemes
    );


    document
        .querySelectorAll(".scheme-step")
        .forEach(step => {
            step.classList.remove("active");
        });


    document
        .querySelector(".scheme-progress")
        .style.display = "none";


    document
        .getElementById("schemeResultsSection")
        .classList.add("active");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// DISPLAY RESULTS
// =========================================================

function displaySchemeResults(results) {

    const container =
        document.getElementById("schemeResults");


    if (!results.length) {

        container.innerHTML = `

            <div class="no-schemes">

                <h3>
                    No matching schemes found
                </h3>

                <p>
                    We could not find a strong match based
                    on the information provided. Try changing
                    your business category or profile details.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        results
            .map(
                scheme =>
                    createSchemeCard(scheme)
            )
            .join("");
}


// =========================================================
// CREATE RESULT CARD
// =========================================================

function createSchemeCard(scheme) {

    return `

        <div class="scheme-result-card">

            <h3>
                ${scheme.name}
            </h3>

            <p>
                ${scheme.shortDescription}
            </p>


            <div class="scheme-meta">

                <span>
                    Match: ${scheme.score}%
                </span>

                <span>
                    ${scheme.source}
                </span>

            </div>


            <p>
                ${scheme.description}
            </p>


            <div class="scheme-card-actions">

                <a
                    href="${scheme.officialUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Official Source ↗
                </a>

                <button
                    type="button"
                    onclick="showSchemeDetails('${scheme.id}')"
                >
                    View Details
                </button>

            </div>

        </div>

    `;
}


// =========================================================
// SCHEME DETAILS
// =========================================================

function showSchemeDetails(schemeId) {

    const scheme =
        schemes.find(
            item => item.id === schemeId
        );


    if (!scheme) {
        return;
    }


    alert(

        scheme.name +
        "\n\n" +

        scheme.description +
        "\n\nSource: " +
        scheme.source

    );
}


// =========================================================
// RESTART
// =========================================================

function restartSchemeFinder() {

    document
        .getElementById("schemeResultsSection")
        .classList.remove("active");


    document
        .querySelector(".scheme-progress")
        .style.display = "flex";


    currentSchemeStep = 1;

    updateSchemeSteps();


    document
        .querySelectorAll(".scheme-step")
        .forEach((step, index) => {

            step.classList.toggle(
                "active",
                index === 0
            );
        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateSchemeSteps();

    }
);