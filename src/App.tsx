import React, { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split("=");
      if (cookieName === name) {
          return decodeURIComponent(cookieValue);
      }
  }
  return null;
}

function setCookie(name: string, value: string, seconds: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + seconds * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

const getSelfInfo = async(sessid : string) => {
  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/getinfo/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({sessid}),
    });

    const data = await response.json()

    if (response.ok) {
      return data;  
    }
    else{
      return null;
    }
  }
  catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again.");
  }
}

const handleLogin = async (username : string, password : string) => {
  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.message.includes("Authorized")){
      alert("Login successful!");
      const end =  Number(data.sessid.split(".")[0]);
      setCookie("sessid",data.sessid,end-(new Date().getSeconds()));
      window.location.reload();
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please try again.");
  }
};

const handleRegister = async (username: string, password: string) => {
  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({"user" : username, "password" : password}),
    });

    const data = await response.json();
    alert(data.message.includes("Registered") ? "Registration successful!" : "Registration failed!");
  } catch (error) {
    console.error("Error during registration:", error);
    alert("An error occurred. Please try again.");
  }
};

const handleCreatePost = async (title: string, body: string) => {
  const sessid = getCookie("sessid");
  if (!sessid) {
    alert("You must be logged in to create a post.");
    return;
  }

  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/create/post/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessid, title, body }),
    });

    const data = await response.json();
    alert(data.Message);
  } catch (error) {
    console.error("Error creating post:", error);
    alert("An error occurred. Please try again.");
  }
};

const PostApp: React.FC = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [displayInfo, setDisplayInfo] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    user: string;
    id: number;
    last_modified: number;
    posts: [number, number, any, string, string, number, number][];
  }>({
    user: "",
    id: 0,
    last_modified: 0,
    posts: [],
  });
  const sessid = getCookie("sessid");

  useEffect(() => {
    const checkSession = async () => {
      if (sessid) {
        const user = await getSelfInfo(sessid);
        if (!user) {
          alert("Session expired, please log in again.");
        } else {
          setDisplayInfo(true);
          setUserInfo(user);
        }
      }
    };
    checkSession();
  }, [sessid]);

  return (
    <div className="Root">
      {displayInfo && userInfo.user ? (
        <div className="user-info">
          <h2>Welcome, {userInfo.user}!</h2>
          <p><strong>User ID:</strong> {userInfo.id}</p>
          <p><strong>Last Modified:</strong> {userInfo.last_modified}</p>
          <button onClick={() => {
            setCookie("sessid", "", -1); 
            setDisplayInfo(false);
            
          }}>Logout</button>
        </div>
      ) : (
        <div className="account-container">
          <button className="login-button" onClick={() => setShowLoginDialog(true)}>Log in</button>
          <button className="register-button" onClick={() => setShowRegisterDialog(true)}>Register</button>
        </div>
      )}
      <div className="post-container">
        <h3>Your Posts</h3>
          <div className="posts">
            {userInfo.posts && userInfo.posts.length > 0 ? (
              userInfo.posts.map((post: any) => (
                <div key={post[0]} className="post">
                  <h4>{post[3]}</h4>
                  <p>{post[4]}</p>
                  <small>Created at: {new Date(post[5] * 1000).toLocaleString()}</small>
                  <small>- {post[7]}</small>
                </div>
              ))
            ) : (
              <p>No posts yet.</p>
            )}
        </div>
      </div>
      <div>
        {showRegisterDialog && (
          <div className="overlay">
            <div className="register-container">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => { handleRegister(username, password); setShowRegisterDialog(false); }}>Register</button>
              <button onClick={() => setShowRegisterDialog(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showLoginDialog && (
          <div className="overlay">
            <div className="register-container">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => { handleLogin(username, password); setShowLoginDialog(false); }}>Login</button>
              <button onClick={() => setShowLoginDialog(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <div className="container">
        <h1>Create a Post</h1>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <button onClick={() => handleCreatePost(title, body)}>Create Post</button>
      </div>
    </div>
  );
};

export default PostApp;
