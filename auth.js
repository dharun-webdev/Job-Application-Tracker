// Minimal localStorage auth for demo (not production security)
const USER_KEY='jt.users'; // [{email,name,password}]
const SESSION_KEY='jt.session'; // {email,name}

function users(){ try { return JSON.parse(localStorage.getItem(USER_KEY)) || []; } catch { return []; } }
function saveUsers(list){ localStorage.setItem(USER_KEY, JSON.stringify(list)); }
function currentUser(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
function setSession(user){ if(user) localStorage.setItem(SESSION_KEY, JSON.stringify({email:user.email,name:user.name})); else localStorage.removeItem(SESSION_KEY); }

window.Auth={ getUsers:users, saveUsers, currentUser, setSession };

// Redirect to login if this page is protected and not signed in
(function(){ const protectedPage=document.documentElement.dataset.protected==='true'; if(!protectedPage) return; if(!currentUser()){ sessionStorage.setItem('jt.redirect', location.pathname); /* where to go back */ }})();
