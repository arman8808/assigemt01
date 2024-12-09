import ENV from "./config.js";
export const getAllEmails = async (page) => {
  try {
    const response = await axios.get(`${ENV.GET_ALL_EMAIL}${page}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching emails:", error);
    throw error;
  }
};

export const getEmailById = async (id) => {
  try {
    const response = await axios.get(`${ENV.GET_ONE_EMAIL}${id}`);

    return response.data;
  } catch (error) {
    console.error("Error fetching email:", error);
    throw error;
  }
};
