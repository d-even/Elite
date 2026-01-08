#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// ===== WIFI =====
const char* ssid = "Deven";        // <-- Replace
const char* password = "INDIA070";    // <-- Replace

// ===== BACKEND =====
// Use your PC IP (backend server)
String backendURL = "http://192.168.0.105:3000/scan";   // <-- Replace

// ===== RFID PINS =====
#define SS_PIN 21
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// Convert UID bytes to HEX string
String getUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    char buffer[3];
    sprintf(buffer, "%02X", rfid.uid.uidByte[i]);
    uid += buffer;
  }
  uid.toUpperCase();
  return uid;
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID Ready");

  WiFi.begin(ssid, password);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {

  // Detect new card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(100);
    return;
  }

  String uid = getUID();
  Serial.println("Card Scanned UID: " + uid);

  // Send UID to backend
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendURL);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"uid\":\"" + uid + "\"}";
    int code = http.POST(json);

    Serial.print("POST /scan -> ");
    Serial.println(code);

    if (code > 0) {
      Serial.println("Response: " + http.getString());
    }

    http.end();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(800);
}

