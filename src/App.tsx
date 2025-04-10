import React, {useEffect,useState } from "react";



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

const getSelfInfo = async (sessid: string) => {
  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/getinfo/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessid }),
    });

    const data = await response.json();
    return response.ok ? data : null;
  } catch (error) {
    console.error("Error getting user info:", error);
    alert("An error occurred. Please try again.");
  }
};

const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.message.includes("Authorized")) {
      alert("Login successful!");
      const end = Number(data.sessid.split(".")[0]);
      const currentUnixTime = Math.floor(Date.now() / 1000);
      setCookie("sessid", data.sessid, end - currentUnixTime);
      
      window.location.reload();
    } else {
      alert("Incorrect username or password.");
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
      body: JSON.stringify({ user: username, password }),
    });

    const data = await response.json();
    alert(data.message.includes("Registered") ? "Registration successful!" : "Registration failed!");
  } catch (error) {
    console.error("Error during registration:", error);
    alert("An error occurred. Please try again.");
  }
};

const handleCreatePost = async (title: string, body: string, sub: Sub) => {
  const sessid = getCookie("sessid");
  if (!sessid) {
    alert("You must be logged in to create a post.");
    return;
  }

  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/create/post/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessid, title, body, sub: sub.name}),
    });

    const data = await response.json();
    alert(data.Message);
  } catch (error) {
    console.error("Error creating post:", error);
    alert("An error occurred. Please try again.");
  }
};


const handleCreateSubreddit = async (name: string, desc: string) => {
  const sessid = getCookie("sessid");
  if (!sessid) {
    alert("You must be logged in to create a subreddit.");
    return;
  }

  try {
    const response = await fetch("https://brezn.markovic.biz/lapi/create/sub/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessid, name, desc }),
    });

    const data = await response.json();
    alert(data.Message);
  } catch (error) {
    console.error("Error creating subreddit:", error);
    alert("An error occurred. Please try again.");
  }
};

type Sub = {
  desc: string;
  id: number;
  name: string;
};

const PostApp: React.FC = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showCreateSubredditDialog, setShowCreateSubredditDialog] = useState(false);
  const [subredditName, setSubredditName] = useState("");
  const [subredditDesc, setSubredditDesc] = useState("");
  const [displayInfo, setDisplayInfo] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    user: string;
    id: number;
    last_modified: number;
    posts: any[];
  }>({ user: "", id: 0, last_modified: 0, posts: [] });

  const sessid = getCookie("sessid");
  const [searchTerm, setSearchTerm] = useState("");
  const [subs, setSubs] = useState<Sub[]>([]);
  const [selectedSub, setSelectedSub] = useState<Sub>({ id: 0, name: "all", desc:"Hello world"});
  const [posts, setPosts] = useState<any[]>([]);
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSubs([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch("https://brezn.markovic.biz/lapi/search/subs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm }),
      })
        .then((res) => res.json())
        .then((data) => setSubs(data))
        .catch((err) => console.error(err));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

    const handleSubClick = async (sub: Sub) => {
    setSelectedSub(sub);
    console.log(sub,console.trace());
    if (sessid!=null){
    const resp = await fetch("https://brezn.markovic.biz/lapi/sub/posts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sub.name , sessid : sessid}),
    })
    const jso = await resp.json();
    if (jso.empty !="true"){
      setPosts(jso.posts)
      console.log(jso.posts)
      
    }
    else{
      setPosts([{id : -1, title:"Be the first person to post here!", body : "This subreddit is currently empty"}])
    }
    }
    else{
      alert("Session ID has expired, please log in again.");
    }
    
      
  };

  

  useEffect(() => {
    const checkSession = async () => {
      if (sessid) {
        const user = await getSelfInfo(sessid);
        if (!user) {
          alert("Session expired, please log in again.");
        } else {
          setDisplayInfo(true);
          setUserInfo(user);
          if (sessid != null) {
            await handleSubClick(selectedSub);
          }
        }
      }
    };
    checkSession();
  }, [sessid]);

  return (
    <div className="Root">
      <div className="sub-search-container">
        <input
          type="text"
          placeholder="Search subreddits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {subs.length > 0 && (
          <ul className="search-results">
            {subs.map((sub) => (
              <li key={sub.id} onClick={async () => await handleSubClick(sub)}>
                {sub.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {displayInfo && userInfo.user ? (
        <div className="user-info">
          <h2>Welcome, {userInfo.user}!</h2>
          <p><strong>User ID:</strong> {userInfo.id}</p>
          <p><strong>Last Modified:</strong> {userInfo.last_modified}</p>
          <button className="auth-button" onClick={() => {
            setCookie("sessid", "", -1);
            setDisplayInfo(false);
            window.location.reload();
          }}>Logout</button>
        </div>
      ) : (
        <div className="account-container">
          <button className="auth-button" onClick={() => setShowLoginDialog(true)}>Log in</button>
          <button className="auth-button" onClick={() => setShowRegisterDialog(true)}>Register</button>
        </div>
      )}

      

      {selectedSub && (
        <div className="sub-info">
          <h2>Welcome to r/{selectedSub.name}</h2>
          <p>{selectedSub.desc}</p>
          <h3>Posts:</h3>
          {posts.length === 0 ? (
            <p>No posts in this sub yet.</p>
          ) : (
            posts.map((post: any) => (
              <div className="post" key={post.id}>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <small>Posted by: {post.username}</small><br />
                <small>Posted: {new Date(post.created * 1000).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}


      {displayInfo && (
        <>
          <button
            className="create-post-button"
            onClick={() => setShowCreatePostDialog(true)}
          >
            +
          </button>

          {showCreatePostDialog && (
            <div className="overlay">
              <div className="create-post-dialog">
                <h2>Create a Post</h2>
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <button
                  onClick={() => {
                    handleCreatePost(title, body,selectedSub);
                    setShowCreatePostDialog(false);
                    setTitle("");
                    setBody("");
                  }}
                >
                  Post
                </button>
                <button onClick={() => setShowCreatePostDialog(false)}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}


      {displayInfo && (
        <div className="post-container">
            <h3>Your Posts</h3>
            <div className="posts">
                {userInfo.posts.length > 0 ? (
                    userInfo.posts.map((post: any) => (
                        <div key={post.id} className="post">
                            <h4>{post.title}</h4>
                            <p>{post.body}</p>
                            <small>Subreddit: r/{post.subname}</small><br />
                            <small>Posted: {new Date(post.created * 1000).toLocaleString()}</small><br />
                            
                        </div>
                    ))
                ) : (
                    <p>No posts yet.</p>
                )}
            </div>
        </div>
      )}

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

      {showCreateSubredditDialog && (
        <div className="overlay">
          <div className="register-container">
            <input
              type="text"
              placeholder="Subreddit Name"
              value={subredditName}
              onChange={(e) => setSubredditName(e.target.value)}
            />
            <textarea
              placeholder="Subreddit Description"
              value={subredditDesc}
              onChange={(e) => setSubredditDesc(e.target.value)}
            />
            <button className="auth-button" onClick={() => {
              handleCreateSubreddit(subredditName, subredditDesc);
              setShowCreateSubredditDialog(false);
            }}>Create Subreddit</button>
            <button onClick={() => setShowCreateSubredditDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      
      {displayInfo && (
        <div>
          <button className="auth-button" onClick={() => setShowCreateSubredditDialog(true)}>Create Subreddit</button>
        </div>
      )}
    </div>
  );
};

export default PostApp;
