import OpenAI from "openai";
import "dotenv/config";
import * as process from "node:process";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const user1Responses = [
  "Larger gatherings",
  "Head (logic)",
  "A weekend hiking trip in nature",
  "Extremely important – I am always working on bettering myself",
  "Quality time (spending focused time together)",
  "Building a family with a partner",
  "No",
  "Yes",
  "No",
  "No",
  "No",
  "Socially – I drink occasionally in social settings",
  "Depends",
  "Yes, I'm religious",
  "Christianity",
  "",
  "Very important",
  "Yes, I'm open to dating someone with different beliefs",
  "Somewhat political – I stay informed about politics and discuss it occasionally",
  "Yes, I'm open to dating someone with different political views",
  "No",
  ""
];

const user2Responses = [
  "Relaxing with close friends",
  "Heart (feelings)",
  "A cozy movie night at home",
  "Moderately important – I like to grow but not obsessively",
  "Words of affirmation (compliments, verbal expressions of love)",
  "Living a simple, peaceful life surrounded by loved ones",
  "Yes",
  "Maybe",
  "Maybe",
  "Yes",
  "Maybe",
  "Rarely – I drink only on special occasions (e.g., holidays, celebrations)",
  "No",
  "No, I'm not religious or spiritual",
  "",
  "",
  "Not important at all",
  "No, I prefer someone who shares my beliefs",
  "Not at all political – I don't follow politics and prefer to avoid political discussions",
  "No",
  ""
];

async function getCompatibilityScore(user1: string[], user2: string[]) {
  const prompt = `
Below are responses from two individuals answering dating questions.
Calculate their compatibility as a number between 0 and 100.
**IMPORTANT:** Your output MUST be a single numeric value only, with no additional text, spaces, or punctuation.

User 1 responses:
1. Do you prefer spending your weekends socializing in larger gatherings or relaxing at home with a few close friends? ${user1[0]}
2. When faced with a major life decision, do you usually follow your head (logic) or your heart (feelings)? ${user1[1]}
3. Which of these activities sounds most appealing to you? ${user1[2]}
4. How important is personal growth in your life? ${user1[3]}
5. How do you like to show affection? ${user1[4]}
6. How do you envision your ideal future? ${user1[5]}
7. Do you have kids? ${user1[6]}
8. Do you want kids in the future? ${user1[7]}
9. Will you date a person who has kids? ${user1[8]}
10. Do you smoke? ${user1[9]}
11. Will you date a smoker? ${user1[10]}
12. How would you describe your drinking habits? ${user1[11]}
13. If "Never", would you be comfortable dating someone who drinks? ${user1[12]}
14. Do you consider yourself religious or spiritual? ${user1[13]}
15. If "Religious", what is your religion or denomination? ${user1[14]}
16. If "Spiritual", would you like to describe your spiritual beliefs? ${user1[15]}
17. How important is religion or spirituality in your life? ${user1[16]}
18. Would you date someone with different religious or spiritual beliefs? ${user1[17]}
19. How would you describe your level of political engagement? ${user1[18]}
20. Would you date someone with different political beliefs? ${user1[19]}
21. Do you have pets? ${user1[20]}
22. If yes, which pet do you have? ${user1[21]}

User 2 responses:
1. Do you prefer spending your weekends socializing in larger gatherings or relaxing at home with a few close friends? ${user2[0]}
2. When faced with a major life decision, do you usually follow your head (logic) or your heart (feelings)? ${user2[1]}
3. Which of these activities sounds most appealing to you? ${user2[2]}
4. How important is personal growth in your life? ${user2[3]}
5. How do you like to show affection? ${user2[4]}
6. How do you envision your ideal future? ${user2[5]}
7. Do you have kids? ${user2[6]}
8. Do you want kids in the future? ${user2[7]}
9. Will you date a person who has kids? ${user2[8]}
10. Do you smoke? ${user2[9]}
11. Will you date a smoker? ${user2[10]}
12. How would you describe your drinking habits? ${user2[11]}
13. If "Never", would you be comfortable dating someone who drinks? ${user2[12]}
14. Do you consider yourself religious or spiritual? ${user2[13]}
15. If "Religious", what is your religion or denomination? ${user2[14]}
16. If "Spiritual", would you like to describe your spiritual beliefs? ${user2[15]}
17. How important is religion or spirituality in your life? ${user2[16]}
18. Would you date someone with different religious or spiritual beliefs? ${user2[17]}
19. How would you describe your level of political engagement? ${user2[18]}
20. Would you date someone with different political beliefs? ${user2[19]}
21. Do you have pets? ${user2[20]}
22. If yes, which pet do you have? ${user2[21]}

Now, output ONLY a single numeric value (for example, 75) representing the compatibility score between these two individuals.
`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 50,
      messages: [
        {
          role: "system",
          content: "You are a dating compatibility algorithm. Your job is to compute a compatibility score between 0 and 100 from two sets of responses. Your answer must be only a number, with no extra text, punctuation, or explanation."
        },
        { role: "user", content: prompt }
      ]
    });

    const rawOutput = response.choices[0].message!.content!.trim();
    const compatibilityScore = parseFloat(rawOutput);
    if (isNaN(compatibilityScore)) {
      throw new Error(`Received output is not a valid number: "${rawOutput}"`);
    }
    console.log(compatibilityScore);
    return compatibilityScore;
  } catch (error: any) {
    console.error("Error during API call:", error.response ? error.response.data : error.message);
  }
}

const questions = [
  {
    question: "I believe in communicating openly about boundaries with my partner.",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  },
  {
    question: "It’s important to me that both partners give enthusiastic consent before progressing to physical intimacy.",
    options: ["Yes", "No"],
  },
  {
    question: "I am interested in a monogamous, exclusive relationship.",
    options: ["Yes", "No", "Not sure yet"],
  },
  {
    question: "Why is exclusivity important to you in a relationship?",
    options: [],
  },
  {
    question: "I am emotionally available and ready to invest in a serious relationship.",
    options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  },
  {
    question: "I have resolved most of my past relationship baggage and am ready to move forward.",
    options: ["Yes", "No"],
  },
];

async function isUserSuitable(userResponses: string[]) {
  let prompt = "Below are responses from a user answering the following dating suitability questions:\n\n";
  questions.forEach((q, index) => {
    prompt += `${index + 1}. ${q.question} ${userResponses[index]}\n`;
  });
  prompt += "\nBased on the user's responses, determine if the user is suitable for the app. ";
  prompt += "Output only 'true' if the user is suitable and 'false' if not. ";
  prompt += "Do not include any additional text, punctuation, spaces, or explanation.";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content: "You are a dating suitability algorithm. Evaluate the user's responses and determine if the user is suitable for the app. Output only 'true' or 'false' with no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    const rawOutput = response.choices[0].message!.content!.trim();
    if (rawOutput !== "true" && rawOutput !== "false") {
      throw new Error(`Received output is not valid: "${rawOutput}"`);
    }
    return rawOutput === "true";
  } catch (error: any) {
    console.error("Error during API call:", error.response ? error.response.data : error.message);
    return false;
  }
}

const userResponses = [
  "Strongly Agree",
  "No",
  "Yes",
  "Exclusivity builds trust and security in relationships.",
  "Strongly Agree",
  "Yes",
];

getCompatibilityScore(user1Responses, user2Responses);
isUserSuitable(userResponses).then((result) => {
  console.log(result);
});
