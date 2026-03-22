const appDiv = document.getElementById("app");

// ---------------- AUTH ----------------

window.register = async function () {
  const nombre = document.getElementById("nombre").value;
  const username = document.getElementById("username").value;
  const contraseña = document.getElementById("password").value;

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, username, contraseña }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Usuario creado correctamente. Ahora podés loguearte.");

    // limpiar campos
    document.getElementById("nombre").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  } else {
    alert(data.msg || "Error al registrarse");
  }
};

window.login = async function () {
  const username = document.getElementById("username").value;
  const contraseña = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, contraseña }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);

    document.getElementById("auth").style.display = "none";
    document.querySelector(".nav").style.display = "flex";

    showFeed();
  } else {
    alert(data.msg || "Credenciales inválidas");
  }
};

// ---------------- FEED ----------------

window.showFeed = async function () {
  const data = await apiFetch("/feed");

  appDiv.innerHTML = `
    <h2>Feed</h2>
    <textarea id="newPost" placeholder="¿Qué estás pensando?"></textarea>
    <button onclick="createPost()">Postear</button>
    <div id="posts"></div>
  `;

  const postsDiv = document.getElementById("posts");
  const currentUser = getCurrentUser();

  data.posts.forEach((p) => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <p class="username" onclick="viewProfile('${p.username}')">${p.username}</p>
      <p>${p.content}</p>

      ${
        p.username === currentUser
          ? `<button onclick="deletePost('${p._id}')">Eliminar</button>`
          : ""
      }

      <button onclick="loadComments('${p._id}')">Ver comentarios</button>
<button onclick="refreshComments('${p._id}')">🔄</button>
<div id="comments-${p._id}"></div>
    `;

    postsDiv.appendChild(el);
  });
};

window.createPost = async function () {
  const content = document.getElementById("newPost").value;

  await fetch("https://socialasync.onrender.com/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: localStorage.getItem("token"),
      content,
    }),
  });

  showFeed();
};

// ---------------- COMMENTS ----------------

window.loadComments = async function (postId) {
  const data = await apiFetch(`/comment/${postId}`);

  const div = document.getElementById("comments-" + postId);
  div.innerHTML = `
    <input id="commentInput-${postId}" placeholder="Escribí un comentario">
    <button onclick="addComment('${postId}')">Comentar</button>
  `;

  data.comments.forEach((c) => {
    const el = document.createElement("p");
    el.className = "comment";
    el.textContent = `${c.username}: ${c.content}`;
    div.appendChild(el);
  });
};

window.addComment = async function (postId) {
  const input = document.getElementById("commentInput-" + postId);
  const content = input.value;

  await fetch("https://socialasync.onrender.com/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: localStorage.getItem("token"),
      postId,
      content,
    }),
  });

  loadComments(postId);
};

// ---------------- SEARCH ----------------

window.showSearch = function () {
  appDiv.innerHTML = `
    <h2>Buscar usuarios</h2>
    <input id="searchInput">
    <button onclick="searchUsers()">Buscar</button>
    <div id="results"></div>
  `;
};

window.searchUsers = async function () {
  const q = document.getElementById("searchInput").value;

  const data = await apiFetch(`/search?username=${q}`);

  const results = document.getElementById("results");
  results.innerHTML = "";

  data.searchList.forEach((u) => {
    const el = document.createElement("div");
    el.innerHTML = `
      <p class="username" onclick="viewProfile('${u.username}')">${u.username}</p>
    `;
    results.appendChild(el);
  });
};

// ---------------- PROFILE ----------------

window.viewProfile = async function (username) {
  const data = await apiFetch(`/posts/${username}`);
  const currentUser = getCurrentUser();

  appDiv.innerHTML = `
    <h2>Perfil: ${username}</h2>
    <button onclick="addFriend('${username}')">Agregar amigo</button>
    <div id="profilePosts"></div>
  `;

  const div = document.getElementById("profilePosts");

  data.posts.forEach((p) => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <p><b>${p.username}</b></p>
      <p>${p.content}</p>

      ${
        p.username === currentUser
          ? `<button onclick="deletePost('${p._id}')">Eliminar</button>`
          : ""
      }

      <button onclick="loadComments('${p._id}')">Ver comentarios</button>
<button onclick="refreshComments('${p._id}')">🔄</button>
<div id="comments-${p._id}"></div>
    `;

    div.appendChild(el);
  });
};

window.addFriend = async function (username) {
  await fetch("https://socialasync.onrender.com/friend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: localStorage.getItem("token"),
      username,
    }),
  });

  alert("Solicitud enviada");
};

window.refreshComments = function (postId) {
  loadComments(postId);
};

// ---------------- FRIENDS ----------------

window.showFriends = async function () {
  const data = await apiFetch("/friend/list");

  appDiv.innerHTML = "<h2>Amigos</h2>";

  data.friendList.forEach((f) => {
    const friend =
      f.emitterUsername === getCurrentUser()
        ? f.recieverUsername
        : f.emitterUsername;

    const el = document.createElement("p");
    el.className = "username";
    el.textContent = friend;
    el.onclick = () => viewProfile(friend);
    appDiv.appendChild(el);
  });
};

window.deletePost = async function (postId) {
  await fetch(`https://socialasync.onrender.com/post/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  showFeed();
};

window.logout = function () {
  localStorage.removeItem("token");

  // mostrar login de nuevo
  document.getElementById("auth").style.display = "block";
  document.querySelector(".nav").style.display = "none";
  document.getElementById("app").innerHTML = "";

  alert("Sesión cerrada");
};

// ---------------- UTILS ----------------

function getCurrentUser() {
  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.username;
}
