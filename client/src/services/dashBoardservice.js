import axios from "axios";

const API_URL = "http://localhost:8000/product/salesreport";

export const getSalesReport = async (params = {}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found!");
      return null;
    }
    console.log("Request params:", params); 

    const response = await axios.get(API_URL, {
      params,
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    console.log("Response data:", response.data);

    if (params.format === "csv") {
      return response.data;
    }

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching sales report:",
      error.response?.data || error
    );
    throw error;
  }
};
