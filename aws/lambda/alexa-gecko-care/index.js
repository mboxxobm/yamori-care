const Alexa = require("ask-sdk-core");
const AWS = require("aws-sdk");

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || "GeckoCareEvents";
const FAMILY_ID = process.env.FAMILY_ID || "laggy-family";

const CARE_LABELS = {
  "コオロギ": "コオロギ投入",
  "ミルワーム": "ミルワーム投入",
  "コオロギフード": "コオロギフード",
  "シーツ交換": "シーツ交換",
  "産卵": "産卵",
  "脱皮": "脱皮",
};

const CARE_TYPES = {
  "コオロギ": "cricket_feed",
  "ミルワーム": "mealworm_feed",
  "コオロギフード": "cricket_food",
  "シーツ交換": "sheet_change",
  "産卵": "egg_laid",
  "脱皮": "shed",
};

function slotValue(handlerInput, name) {
  const request = handlerInput.requestEnvelope.request || {};
  const intent = request.intent || {};
  const slots = intent.slots || {};
  const slot = slots[name];

  if (
    slot &&
    slot.resolutions &&
    slot.resolutions.resolutionsPerAuthority &&
    slot.resolutions.resolutionsPerAuthority[0] &&
    slot.resolutions.resolutionsPerAuthority[0].values &&
    slot.resolutions.resolutionsPerAuthority[0].values[0] &&
    slot.resolutions.resolutionsPerAuthority[0].values[0].value &&
    slot.resolutions.resolutionsPerAuthority[0].values[0].value.name
  ) {
    return slot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
  }

  return slot && slot.value ? slot.value : "";
}

function alexaUserId(handlerInput) {
  const system = handlerInput.requestEnvelope.context.System;
  return system && system.user && system.user.userId ? system.user.userId : "unknown";
}

function todayInTokyo() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

async function saveCareEvent(data) {
  const now = new Date().toISOString();
  const count = data.count ? Number(data.count) : null;
  const item = {
    familyId: FAMILY_ID,
    createdAt: now,
    id: `${now}-${Math.random().toString(36).slice(2)}`,
    date: todayInTokyo(),
    gecko: data.gecko || "",
    careType: data.careType || "",
    type: CARE_TYPES[data.careType] || "other",
    label: CARE_LABELS[data.careType] || data.careType || "記録",
    count: Number.isFinite(count) ? count : null,
    note: data.rawText || "",
    source: "alexa",
    createdBy: data.userId || "unknown",
  };

  await dynamoDb
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  handle(handlerInput) {
    const speakOutput =
      "やもりケアです。福ちゃんにコオロギ2匹、または、ここあちゃんが脱皮した、のように言ってください。";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

const AddCareEventIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AddCareEventIntent"
    );
  },
  async handle(handlerInput) {
    const gecko = slotValue(handlerInput, "gecko");
    const careType = slotValue(handlerInput, "careType");
    const count = slotValue(handlerInput, "count");
    const label = CARE_LABELS[careType] || careType || "記録";
    const target = gecko || "全体";
    const countText = count ? `${count}匹` : "";
    const rawText = `${target} ${label} ${countText}`.trim();

    await saveCareEvent({
      gecko,
      careType,
      count,
      rawText,
      userId: alexaUserId(handlerInput),
    });

    const speakOutput = `${target}の${label}${countText}を保存しました。`;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const AskLatestEventIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AskLatestEventIntent"
    );
  },
  async handle(handlerInput) {
    const gecko = slotValue(handlerInput, "gecko");
    const careType = slotValue(handlerInput, "careType");

    const result = await dynamoDb
      .query({
        TableName: TABLE_NAME,
        KeyConditionExpression: "familyId = :familyId",
        ExpressionAttributeValues: {
          ":familyId": FAMILY_ID,
        },
        ScanIndexForward: false,
        Limit: 50,
      })
      .promise();

    const matched = (result.Items || []).find((item) => {
      if (gecko && item.gecko !== gecko) return false;
      if (careType && item.careType !== careType) return false;
      return true;
    });

    if (!matched) {
      const target = gecko || "全体";
      const label = CARE_LABELS[careType] || careType || "記録";
      return handlerInput.responseBuilder.speak(`${target}の${label}はまだ記録がありません。`).getResponse();
    }

    const countText = matched.count ? `${matched.count}匹` : "";
    const speakOutput = `最後の記録は、${matched.date}、${matched.gecko || "全体"}の${matched.label}${countText}です。`;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "福ちゃんにコオロギ2匹、コオロギフード交換、そめちゃんが卵を産んだ、のように話してください。";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("やもりケアを終了します。").getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "うまく聞き取れませんでした。福ちゃんにコオロギ2匹、のように言ってください。";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "SessionEndedRequest";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log("ERROR", error);
    const speakOutput = "すみません。保存中にエラーが起きました。設定を確認してください。";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AddCareEventIntentHandler,
    AskLatestEventIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
