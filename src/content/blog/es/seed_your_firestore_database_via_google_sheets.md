---
title: Cómo llenar tu base de datos de Firestore usando Google Sheets
description: Guía paso a paso para desarrolladores sobre cómo configurar un sistema que transfiera datos desde Google Sheets a Firestore de forma eficiente y automatizada.
pubDate: 2025-03-12
hero: "~/assets/heros/google_sheet_with_firestore.jpg"
heroAlt: "Firestore y Google Sheets conectados"
tags: ["Firebase", "Firestore", "Google Sheets", "Automatización", "Base de Datos", "Apps Script"]
language: "es"
---

# Cómo llenar tu base de datos de Firestore usando Google Sheets

## 🚀 Introducción

Firestore ofrece una potente base de datos para aplicaciones, pero poblar y mantener estos datos puede ser tedioso. La consola de Firebase no está optimizada para la entrada masiva de información, y desarrollar scripts personalizados consume tiempo valioso.

Google Sheets puede convertirse en la solución ideal: una herramienta familiar que permite gestionar datos visualmente y transferirlos a Firestore sin complicaciones. Es perfecta para preparar datos iniciales, permitir que miembros no técnicos actualicen contenido y gestionar grandes volúmenes de información.

## 🔐 Paso 1: Configuración de la autenticación con Firestore

El primer paso para conectar Google Sheets con Firestore es establecer la autenticación adecuada. Necesitaremos crear y configurar las credenciales de servicio de Firebase y preparar las funciones para obtener tokens de acceso.

### Creando las credenciales de servicio

Primero, debemos obtener un archivo de credenciales de cuenta de servicio desde la consola de Firebase:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/) y selecciona tu proyecto
2. Navega a Configuración del proyecto > Cuentas de servicio
3. Haz clic en "Generar nueva clave privada"
4. Guarda el archivo JSON descargado

### Obteniendo los IDs necesarios

Estos IDs se utilizarán en el código para autenticar las solicitudes a Firestore:

- **CREDENTIALS_FILE_ID**: El ID del archivo de credenciales en Google Drive (se encuentra en la URL cuando abres el archivo: `https://drive.google.com/file/d/[ID-AQUÍ]/view`)
- **PROJECT_ID**: El ID de tu proyecto Firebase (disponible en el archivo de credenciales JSON bajo la clave `project_id`)

```javascript
const CREDENTIALS_FILE_ID = "1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sTuV"; // ID del archivo de credenciales
const PROJECT_ID = "my-project-12345"; // ID de tu proyecto Firebase

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

### ¿Qué hace este código?

- **getServiceAccountKey()**: Recupera y parsea las credenciales del archivo JSON almacenado en Google Drive
- **createJWT()**: Crea un token JWT firmado con la clave privada de las credenciales
- **getAccessToken()**: Utiliza el JWT para obtener un token de acceso OAuth que nos permitirá interactuar con Firestore

Este token de acceso será esencial para autenticar nuestras solicitudes a Firestore en los siguientes pasos.

## 📊 Paso 2: Preparación y carga de datos desde Google Sheets a Firestore

Una vez configurada la autenticación, el siguiente paso es transformar nuestros datos de Google Sheets en el formato adecuado para Firestore y cargarlos en la base de datos.

### Funciones de transformación y carga de datos

Este código se encarga de obtener datos de las hojas de cálculo, convertirlos al formato requerido por Firestore y enviarlos a la base de datos:

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

### ¿Cómo funciona este código?

1. **Extracción de datos de Google Sheets**: 
   - La función `getJSONArray()` convierte una hoja de cálculo en un array de objetos JSON
   - Utiliza la primera fila como nombres de propiedades para cada objeto
   - Cada fila subsiguiente se convierte en un objeto con sus valores correspondientes

2. **Conversión al formato de Firestore**: 
   - `convertToFirestoreObject()` transforma cada objeto JSON en el formato específico requerido por la API REST de Firestore
   - `createFieldValue()` detecta automáticamente el tipo de cada valor (string, number, boolean, array) y lo estructura según el formato que espera Firestore
   - Los campos vacíos se omiten para mantener los documentos limpios

3. **Generación de IDs únicos**: 
   - Para cada documento, se genera un ID UUID único mediante `Utilities.getUuid()`

4. **Carga por lotes (batch)**: 
   - `batchCreateDocuments()` agrupa todos los documentos para enviarlos en una sola petición
   - `firestoreBatchRequest()` realiza la petición HTTP a la API REST de Firestore utilizando el token de acceso generado en el Paso 1

### Estructura de Google Sheets

Para que este código funcione correctamente, tu hoja de cálculo debe:
- Tener nombres de columnas en la primera fila
- Tener el mismo nombre que la colección de Firestore donde quieres almacenar los datos
- Contener datos en un formato compatible (texto, números, booleanos o arrays)

## 🔧 Paso 3: Creación de funciones para el menú de Google Sheets

Para facilitar la ejecución de nuestras funciones de carga de datos, podemos crear opciones personalizadas en el menú de Google Sheets. Esto nos permitirá poblar nuestras colecciones de Firestore con solo unos clics.

Cada función `seedXXXCollection()` está diseñada para cargar datos en una colección específica

### Configuración de colecciones específicas

Primero, definimos constantes para los nombres de nuestras colecciones y creamos funciones específicas para cada una:

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

### Creando el menú en Google Sheets

Ahora, necesitamos añadir una función para crear el menú en Google Sheets:

```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Firestore')
      .addItem('Cargar todas las colecciones V1', 'seedV1Collections')
      .addSeparator()
      .addItem('Cargar colección de tonos', 'seedRingtonesCollection')
      .addItem('Cargar colección de tipos de fuentes', 'seedSourceTypeCollection')
      .addToUi();
}
```

### Ejemplo de uso

Una vez implementado, verás un nuevo menú "Firestore" en tu barra de menú de Google Sheets. Para cargar datos:

1. Asegúrate de tener una hoja con el mismo nombre que la colección destino (por ejemplo, "ringtones_v1")
2. Haz clic en el menú "Firestore"
3. Selecciona la opción deseada, como "Cargar colección de tonos"
4. Los datos se transformarán y cargarán automáticamente en Firestore

### Estructura recomendada para tus hojas de cálculo

Para mantener tu solución organizada:

- Crea una hoja separada para cada colección con su nombre exacto
- Mantén una hoja de documentación explicando la estructura de datos
- Considera tener hojas de "staging" para preparar datos antes de cargarlos

## 🎯 Conclusión

Con esta implementación, has creado un puente eficiente entre Google Sheets y Firestore que te permite:

1. **Gestionar datos de forma visual**: Utiliza la interfaz familiar de hojas de cálculo para estructurar tus datos
2. **Automatizar la carga**: Con solo unos clics puedes poblar o actualizar colecciones enteras
3. **Mantener control sobre tus datos**: El código está diseñado para manejar diferentes tipos de datos y colecciones

Y lo mejor de todo: ahora puedes llevar esto un paso más allá conectando Google Forms a tus hojas de cálculo. Esto significa que cualquier persona, puede contribuir con datos a tu aplicación sin tener acceso directo a tu base de datos. 

Imagina crear un formulario para que los usuarios envíen contenido, que automáticamente se guarde en Google Sheets y luego, con un simple clic, se transfiera a Firestore para que aparezca en tu aplicación. ¡Todo esto sin escribir una sola línea de código adicional! 😎