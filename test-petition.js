import fetch from "node-fetch";

const testPetition = async () => {
  try {
    const formData = new FormData();
    formData.append("title", "Test Petition");
    formData.append("country", "United States");
    formData.append(
      "petitionDetails",
      JSON.stringify({
        problem: "Test problem description",
        solution: "Test solution description",
      })
    );
    formData.append(
      "petitionStarter",
      JSON.stringify({
        name: "John Doe",
        mobile: "+1234567890",
        aadharNumber: "123456789012",
        age: 30,
        location: "Test City, US",
        comment: "Test comment",
        pincode: "12345",
      })
    );
    formData.append("decisionMakers", JSON.stringify([]));

    const response = await fetch("http://localhost:8000/api/petitions", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", result);
  } catch (error) {
    console.error("Error:", error);
  }
};

testPetition();
