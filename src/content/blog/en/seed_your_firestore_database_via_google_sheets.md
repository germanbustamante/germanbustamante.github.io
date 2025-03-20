---
title: How to Populate Your Firestore Database Using Google Sheets
description: Step-by-step guide for developers on how to set up a system that efficiently and automatically transfers data from Google Sheets to Firestore.
pubDate: 2025-03-12
hero: "~/assets/heros/google_sheet_with_firestore.jpg"
heroAlt: "Firestore and Google Sheets connected"
tags: ["Firebase", "Firestore", "Google Sheets", "Automation", "Database", "Apps Script"]
language: "en"
---

# How to Populate Your Firestore Database Using Google Sheets

## 🚀 Introduction

Firestore offers a powerful database for applications, but populating and maintaining this data can be tedious. The Firebase console is not optimized for massive data entry, and developing custom scripts consumes valuable time.

Google Sheets can become the ideal solution: a familiar tool that allows you to visually manage data and transfer it to Firestore without complications. It's perfect for preparing initial data, allowing non-technical members to update content, and managing large volumes of information.

## 🔐 Step 1: Setting Up Authentication with Firestore

The first step to connect Google Sheets with Firestore is to establish proper authentication. We'll need to create and configure Firebase service credentials and prepare functions to obtain access tokens.

### Creating Service Credentials

First, we need to obtain a service account credentials file from the Firebase console:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your project
2. Navigate to Project Settings > Service Accounts
3. Click "Generate New Private Key"
4. Save the downloaded JSON file

### Obtaining the Necessary IDs

These IDs will be used in the code to authenticate requests to Firestore:

- **CREDENTIALS_FILE_ID**: The ID of the credentials file in Google Drive (found in the URL when you open the file: `https://drive.google.com/file/d/[ID-HERE]/view`)
- **PROJECT_ID**: The ID of your Firebase project (available in the JSON credentials file under the `project_id` key)

```javascript
const CREDENTIALS_FILE_ID = "1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sTuV"; // Credentials file ID
const PROJECT_ID = "my-project-12345"; // Your Firebase project ID

function getServiceAccountKey() {
  var file = DriveApp.getFileById(CREDENTIALS_FILE_ID);
  return JSON.parse(file.getBlob().getDataAsString());
}

function createJWT(serviceAccount) {
  var header = {
    alg: "RS256",
    typ: "JWT",
  };

  var now = Math.floor(Date.now() / 1000);
  var claimSet = {
    iss: serviceAccount.client_email,
    scope:
      "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform",
    aud: "https://www.googleapis.com/oauth2/v4/token",
    exp: now + 3600,
    iat: now,
  };

  var signatureInput =
    Utilities.base64EncodeWebSafe(JSON.stringify(header)) +
    "." +
    Utilities.base64EncodeWebSafe(JSON.stringify(claimSet));
  var signature = Utilities.computeRsaSha256Signature(
    signatureInput,
    serviceAccount.private_key
  );
  var jwt = signatureInput + "." + Utilities.base64EncodeWebSafe(signature);

  return jwt;
}

function getAccessToken() {
  var serviceAccount = getServiceAccountKey();
  var tokenUrl = "https://www.googleapis.com/oauth2/v4/token";
  var payload = {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: createJWT(serviceAccount),
  };

  var options = {
    method: "post",
    payload: payload,
  };

  var response = UrlFetchApp.fetch(tokenUrl, options);
  var token = JSON.parse(response.getContentText()).access_token;
  return token;
}
```

### What Does This Code Do?

- **getServiceAccountKey()**: Retrieves and parses the credentials from the JSON file stored in Google Drive
- **createJWT()**: Creates a JWT token signed with the private key from the credentials
- **getAccessToken()**: Uses the JWT to obtain an OAuth access token that will allow us to interact with Firestore

This access token will be essential to authenticate our requests to Firestore in the following steps.

## 📊 Step 2: Preparing and Loading Data from Google Sheets to Firestore

Once authentication is set up, the next step is to transform our Google Sheets data into the appropriate format for Firestore and load it into the database.

### Data Transformation and Loading Functions

This code handles retrieving data from spreadsheets, converting it to the format required by Firestore, and sending it to the database:

```javascript
function seedData(collectionName) { 
  const COLLECTION_NAME = collectionName;
  const data = getJSONArray(COLLECTION_NAME);
  var firestoreData = data.map((d) => convertToFirestoreObject(d));
  console.log("Array of Firestore Objects",firestoreData);

  batchCreateDocuments(firestoreData, COLLECTION_NAME);

  // Uncomment the following code to split the data into multiple parts and insert them in batches if the data is too large

  // const quarter = Math.ceil(firestoreData.length / 4);
  // const firstQuarter = firestoreData.slice(0, quarter);
  // const secondQuarter = firestoreData.slice(quarter, 2 * quarter);
  // const thirdQuarter = firestoreData.slice(2 * quarter, 3 * quarter);
  // const fourthQuarter = firestoreData.slice(3 * quarter);

  // batchCreateDocuments(firstQuarter, COLLECTION_NAME);
  // batchCreateDocuments(secondQuarter, COLLECTION_NAME);
  // batchCreateDocuments(thirdQuarter, COLLECTION_NAME);
  // batchCreateDocuments(fourthQuarter, COLLECTION_NAME);
}

function convertToFirestoreObject(data) {
  let firestoreObject = {
    id: Utilities.getUuid(),
    fields: {},
  };

  for (const key in data) {
    if (data[key] !== "") {
      firestoreObject.fields[key] = createFieldValue(data[key]);
    }
  }
  return firestoreObject;
}

function createFieldValue(value) {
  if (typeof value === "string") {
    return { stringValue: value };
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: value };
    } else {
      return { doubleValue: value };
    }
  } else if (typeof value === "boolean") {
    return { booleanValue: value };
  } else if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(createFieldValue) } };
  } else if (value === null) {
    return { nullValue: null };
  }

  return { nullValue: null };
}

function batchCreateDocuments(documents, collectionName) {
  var collectionPath = "/" + collectionName;

  var writes = documents.map(function (doc) {
    return {
      update: {
        name: `projects/${PROJECT_ID}/databases/(default)/documents${collectionPath}/${doc.id}`,
        fields: doc.fields,
      },
    };
  });

  var payload = {
    writes: writes,
  };

  var response = firestoreBatchRequest("batchWrite", payload);
  Logger.log(response);
}

function firestoreBatchRequest(endpoint, payload) {
  var token = getAccessToken();
  var url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;

  var options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token,
    },
    payload: JSON.stringify(payload),
  };

  var response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

const getJSONArray = (name) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  // console.log("Raw Data in 2D Array Format",data)
  const heads = data.shift();
  const arr = data.map((r) =>
    heads.reduce((o, k, i) => ((o[k] = r[i] || ""), o), {})
  );
  // console.log("JSON Array",arr);
  return arr;
};
```

### How Does This Code Work?

1. **Data Extraction from Google Sheets**:
   - The `getJSONArray()` function converts a spreadsheet into an array of JSON objects
   - It uses the first row as property names for each object
   - Each subsequent row is converted into an object with its corresponding values

2. **Conversion to Firestore Format**:
   - `convertToFirestoreObject()` transforms each JSON object into the specific format required by the Firestore REST API
   - `createFieldValue()` automatically detects the type of each value (string, number, boolean, array) and structures it according to the format expected by Firestore
   - Empty fields are omitted to keep documents clean

3. **Generating Unique IDs**:
   - For each document, a unique UUID is generated using `Utilities.getUuid()`

4. **Batch Loading**:
   - `batchCreateDocuments()` groups all documents to send them in a single request
   - `firestoreBatchRequest()` makes the HTTP request to the Firestore REST API using the access token generated in Step 1

### Google Sheets Structure

For this code to work correctly, your spreadsheet must:
- Have column names in the first row
- Have the same name as the Firestore collection where you want to store the data
- Contain data in a compatible format (text, numbers, booleans, or arrays)

## 🔧 Step 3: Creating Functions for the Google Sheets Menu

To facilitate the execution of our data loading functions, we can create custom options in the Google Sheets menu. This will allow us to populate our Firestore collections with just a few clicks.

Each `seedXXXCollection()` function is designed to load data into a specific collection.

### Setting Up Specific Collections

First, we define constants for the names of our collections and create specific functions for each one:

```javascript
const RINGTONES_V1_COLLECTION_NAME = "ringtones_v1"
const SOURCE_TYPE_V1_COLLECTION_NAME = "sourceTypes_v1"

function seedV1Collections() {
  seedRingtonesCollection()
  seedSourceTypeCollection()
}

function seedRingtonesCollection() {
  seedData(RINGTONES_V1_COLLECTION_NAME)
}

function seedSourceTypeCollection() {
  seedData(SOURCE_TYPE_V1_COLLECTION_NAME, "name")
}
```

### Creating the Menu in Google Sheets

Now, we need to add a function to create the menu in Google Sheets:

```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Firestore')
      .addItem('Load All V1 Collections', 'seedV1Collections')
      .addSeparator()
      .addItem('Load Ringtones Collection', 'seedRingtonesCollection')
      .addItem('Load Source Types Collection', 'seedSourceTypeCollection')
      .addToUi();
}
```

### Example of Use

Once implemented, you'll see a new "Firestore" menu in your Google Sheets menu bar. To load data:

1. Make sure you have a sheet with the same name as the target collection (e.g., "ringtones_v1")
2. Click on the "Firestore" menu
3. Select the desired option, such as "Load Ringtones Collection"
4. The data will be automatically transformed and loaded into Firestore

### Recommended Structure for Your Spreadsheets

To keep your solution organized:

- Create a separate sheet for each collection with its exact name
- Maintain a documentation sheet explaining the data structure
- Consider having "staging" sheets to prepare data before loading

## 🎯 Conclusion

With this implementation, you've created an efficient bridge between Google Sheets and Firestore that allows you to:

1. **Manage Data Visually**: Use the familiar spreadsheet interface to structure your data
2. **Automate Loading**: With just a few clicks, you can populate or update entire collections
3. **Maintain Control Over Your Data**: The code is designed to handle different types of data and collections

And best of all: now you can take this a step further by connecting Google Forms to your spreadsheets. This means that anyone can contribute data to your application without direct access to your database.

Imagine creating a form for users to submit content, which automatically saves in Google Sheets and then, with a simple click, transfers to Firestore to appear in your application. All this without writing a single additional line of code! 😎