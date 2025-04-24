import React, { useState, useEffect } from "react";
import axios from "axios";
import Confetti from "react-confetti"; // For confetti animation
import "animate.css"; // For simple animations

const VoiceDetectionScreen = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState("");
  const [serverRunning, setServerRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if the server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/");
        if (response.status === 200) setServerRunning(true);
      } catch (error) {
        console.error("Server connectivity issue:", error.message);
        setServerRunning(false);
        alert(
          "Unable to connect to the backend server. Please ensure the server is running."
        );
      }
    };

    checkServer();
  }, []);

  // Handle file upload
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];

      // Handle file selection cancellation
      if (!file) return;

      setSelectedFile(file.name);

      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Please select a file smaller than 10MB.");
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to backend
      const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Display result
      const simulatedResult = response.data.result;
      setResult(simulatedResult);

      // Trigger confetti for "real" result
      if (simulatedResult === "real") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      console.error("File upload error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message || "Failed to upload the file. Please try again."
      );
    }
  };

  return (
    <view style={styles.container}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      <h1 style={styles.title}>Voice Detection</h1>
      <div style={styles.uploadSection}>
        <button
          style={{
            ...styles.button,
            backgroundColor: !serverRunning ? "#ccc" : "#606c38",
            cursor: !serverRunning ? "not-allowed" : "pointer",
          }}
          onClick={() => document.getElementById("file-input").click()}
          disabled={!serverRunning}
        >
          <i className="material-icons" style={styles.icon}>Upload Voice File</i>
        </button>
        <input
          id="file-input"
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        {!serverRunning && (
          <p style={styles.errorText}>Backend is not running</p>
        )}
      </div>

      {selectedFile && (
        <div style={styles.fileInfo}>
          <p><strong>Selected File:</strong> {selectedFile}</p>
        </div>
      )}

      {result && (
        <div
          style={
            result === "real" ? styles.realResultSection : styles.fakeResultSection
          }
        >
          <p
            className={`animate__animated ${
              result === "real" ? "animate__bounce" : "animate__flash"
            }`}
            style={styles.resultText}
          >
            {result === "real" ? "😊 The result is Real!" : "🤔 The result is Fake!"}
          </p>
        </div>
      )}
    </view>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#fefae0",
    borderRadius: "8px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    margin: "auto",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    color: "#333",
    marginBottom: "20px",
  },
  uploadSection: {
    marginBottom: "20px",
  },
  button: {
    padding: "15px 30px",
    borderRadius: "10px",
    color: "#fefae0",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    justifyContent: "center",
    transition: "background-color 0.3s ease",
  },
  icon: {
    fontSize: "20px",
  },
  fileInfo: {
    backgroundColor: "#fff",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  realResultSection: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#eaf7e0",
    borderRadius: "5px",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  fakeResultSection: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#fdecea",
    borderRadius: "5px",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  resultText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#283618",
  },
  errorText: {
    color: "red",
    marginTop: "10px",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default VoiceDetectionScreen;
