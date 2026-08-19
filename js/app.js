(function(){
  const menuBtn=document.getElementById('menuBtn');
  const nav=document.getElementById('mainNav');
  if(menuBtn&&nav) menuBtn.addEventListener('click',()=>nav.classList.toggle('open'));
  const authLink=document.getElementById('authLink');
  const session=JSON.parse(localStorage.getItem('bl_session')||'null');
  if(authLink&&session){authLink.textContent='Mon espace';authLink.href='profile.html';}
})();
