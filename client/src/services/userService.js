import axios from "axios";

const API_URL = "http://localhost:8000/user";

export const getUsers = async (
  search = "",
  role = "",
  page = 1,
  limit = 10
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found!");
      return { users: [], totalPages: 1 };
    }

    const response = await axios.get(API_URL, {
      params: { search, role, page, limit },
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error.response?.data || error);
    return { users: [], totalPages: 1 };
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem("token"); // Get token from storage
    if (!token) {
      console.error("No token found!");
      return { success: false, message: "Unauthorized: No token provided" };
    }

    const response = await axios.delete(`${API_URL}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }, // Send token
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error.response?.data || error);
    return { success: false, message: "Failed to delete user" };
  }
};

export const addUser = async (userData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(API_URL, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, user: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

export const updateUser = async (id, userData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/${id}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, user: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};
