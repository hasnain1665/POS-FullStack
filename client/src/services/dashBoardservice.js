import axios from "axios";

const API_URL = "http://localhost:8000/product/salesreport";

export const getSalesReport = async (params = {}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found!");
      return null;
    }

    const config = {
      params,
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    };

    // If CSV export is requested, change responseType to 'blob'
    if (params.format === "csv") {
      config.responseType = "blob";
    }

    const response = await axios.get(API_URL, config);

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching sales report:",
      error.response?.data || error
    );
    throw error;
  }
};
