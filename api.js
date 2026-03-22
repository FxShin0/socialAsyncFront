const API = "https://socialasync.onrender.com";

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(API + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      ...options.headers
    }
  });

  return res.json();
}