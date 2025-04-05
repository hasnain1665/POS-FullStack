import axios from "axios";

const API_URL = "http://localhost:8000/product"; // Match your backend route

export const getProducts = async (
  search = "",
  category = "",
  minPrice = "",
  maxPrice = "",
  minStock = "",
  maxStock = "",
  page = 1,
  limit = 10
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found!");
      return { products: [], totalPages: 1 };
    }

    const response = await axios.get(API_URL, {
      params: {
        search,
        category,
        minPrice,
        maxPrice,
        minStock,
        maxStock,
        page,
        limit,
      },
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    console.log("Data", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error.response?.data || error);
    return { products: [], totalPages: 1 };
  }
};

export const deleteProduct = async (productId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found!");
      return { success: false, message: "Unauthorized: No token provided" };
    }

    const response = await axios.delete(`${API_URL}/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error.response?.data || error);
    return { success: false, message: "Failed to delete product" };
  }
};

export const addProduct = async (productData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(API_URL, productData, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return { success: true, product: response.data };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.errors?.[0]?.msg || error.response?.data?.message,
    };
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/${id}`, productData, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return { success: true, product: response.data };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.errors?.[0]?.msg || error.response?.data?.message,
    };
  }
};

export const restockProduct = async (productId, quantity) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${API_URL}/restock`,
      { productId, quantity },
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    return { success: true, product: response.data.product };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to restock product",
    };
  }
};

export const getProductCategories = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    // Extract unique categories from products
    const categories = [
      ...new Set(response.data.products.map((p) => p.category)),
    ];
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};
