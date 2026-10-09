(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();const _={name:"VoxelPrint",copyright:`© ${new Date().getFullYear()} VoxelPrint. Tous droits réservés.`,discountPercent:10,adminPassword:"@19283746"},me=[{id:"dual-text",name:"Dual Texte Illusion 3D",slug:"product-dual-text",category:"Illusion Optique",description:"Une sculpture 3D qui affiche deux mots différents selon l'angle de vue. Un effet bluffant qui surprend à chaque regard. Parfait comme cadeau personnalisé ou décoration unique.",shortDesc:"Deux textes, une sculpture. L'illusion parfaite.",price:29.99,icon:"🔤",emoji:"✨",features:["Personnalisation totale des 2 textes","Impression PLA haute qualité","Plusieurs tailles disponibles","Livraison partout en France","Effet garanti à 100%"],demoFields:["text1","text2","email"],options:[{label:"Petite (10cm)",price:29.99},{label:"Moyenne (15cm)",price:39.99},{label:"Grande (20cm)",price:49.99}],badge:"⭐ Best-seller",socialProof:"127 commandes ce mois",urgency:""},{id:"3d-map",name:"Map 3D de Lieu",slug:"product-3d-map",category:"Cartographie 3D",description:"Transformez n'importe quel lieu en une magnifique carte 3D imprimée. Votre quartier, votre ville, un lieu qui vous est cher... immortalisé en relief.",shortDesc:"Votre lieu préféré en relief 3D.",price:49.99,icon:"🗺️",emoji:"🏔️",features:["N'importe quel lieu dans le monde","Relief topographique précis","Noms de rues en relief","Cadre inclus (optionnel)","Haute résolution d'impression"],demoFields:["location","email"],options:[{label:"Standard (15x15cm)",price:49.99},{label:"Large (20x20cm)",price:69.99},{label:"XL (30x30cm)",price:89.99}],badge:"🎁 Idée cadeau",socialProof:"89 commandes ce mois",urgency:""},{id:"gpx-map",name:"Map 3D depuis GPX",slug:"product-gpx-map",category:"Cartographie 3D",description:"Envoyez votre fichier GPX (randonnée, vélo, course...) et recevez une magnifique carte 3D de votre parcours avec le tracé en relief. Le souvenir parfait de vos aventures.",shortDesc:"Votre parcours GPX en sculpture 3D.",price:59.99,icon:"📍",emoji:"🚴",features:["Compatible tous fichiers GPX","Parcours mis en relief","Données d'altitude intégrées","Personnalisation des couleurs","Cadre et socle inclus"],demoFields:["gpx","email"],options:[{label:"Standard (15x15cm)",price:59.99},{label:"Large (20x20cm)",price:79.99},{label:"XL (30x30cm)",price:99.99}],badge:"🏃 Sportifs",socialProof:"64 commandes ce mois",urgency:""}];function pe(e){return me.find(t=>t.id===e)}const E={siteName:_.name,discountPercent:_.discountPercent,adminPassword:_.adminPassword},G="obj3d_cart",K="obj3d_discount";class fe{constructor(){this.items=this.load(),this.discount=this.loadDiscount(),this.listeners=[]}load(){try{return JSON.parse(localStorage.getItem(G))||[]}catch{return[]}}save(){localStorage.setItem(G,JSON.stringify(this.items)),this.notify()}loadDiscount(){try{return JSON.parse(localStorage.getItem(K))||null}catch{return null}}saveDiscount(){localStorage.setItem(K,JSON.stringify(this.discount))}addItem(t,n=0,s={}){const o=t.options[n],i=this.items.find(a=>a.productId===t.id&&a.optionIndex===n);return i?i.quantity+=1:this.items.push({productId:t.id,name:t.name,optionLabel:o.label,optionIndex:n,price:o.price,quantity:1,icon:t.icon,customData:s}),this.save(),!0}removeItem(t){this.items.splice(t,1),this.save()}updateQuantity(t,n){if(n<=0){this.removeItem(t);return}this.items[t].quantity=n,this.save()}clear(){this.items=[],this.save()}getItemCount(){return this.items.reduce((t,n)=>t+n.quantity,0)}getSubtotal(){return this.items.reduce((t,n)=>t+n.price*n.quantity,0)}getDiscountAmount(){return this.discount?this.getSubtotal()*(this.discount.percent/100):0}getTotal(){return this.getSubtotal()-this.getDiscountAmount()}applyDiscount(t){const n=localStorage.getItem("obj3d_discount_code");return n&&t.toUpperCase()===n.toUpperCase()?(this.discount={code:t,percent:E.discountPercent},this.saveDiscount(),this.notify(),!0):!1}removeDiscount(){this.discount=null,this.saveDiscount(),this.notify()}onChange(t){this.listeners.push(t)}notify(){this.listeners.forEach(t=>t(this))}}const m=new fe;function D(){const e=document.querySelectorAll(".cart-badge"),t=m.getItemCount();e.forEach(n=>{n.textContent=t,t>0?n.classList.add("active"):n.classList.remove("active")})}function ve(){D(),m.onChange(()=>D())}function ge(){const e=document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children");if(!e.length)return;const t=new IntersectionObserver(n=>{n.forEach(s=>{s.isIntersecting&&(s.target.classList.add("visible"),t.unobserve(s.target))})},{threshold:.1,rootMargin:"0px 0px -50px 0px"});e.forEach(n=>t.observe(n))}function ye(){document.querySelectorAll(".tilt-card").forEach(t=>{t.addEventListener("mousemove",n=>{const s=t.getBoundingClientRect(),o=n.clientX-s.left,i=n.clientY-s.top,a=s.width/2,r=s.height/2,l=(i-r)/r*-8,c=(o-a)/a*8;t.style.transition="none",t.style.transform=`perspective(1000px) rotateX(${l}deg) rotateY(${c}deg) translateZ(10px)`}),t.addEventListener("mouseleave",()=>{t.style.transition="transform 0.5s ease",t.style.transform="perspective(1000px) rotateX(0) rotateY(0) translateZ(0)"})})}function he(){const e=document.querySelectorAll("[data-counter]");if(!e.length)return;const t=new IntersectionObserver(n=>{n.forEach(s=>{if(s.isIntersecting){let u=function(p){const b=p-c,v=Math.min(b/l,1),S=1-Math.pow(1-v,3),T=Math.floor(S*a);i.textContent=T.toLocaleString()+r,v<1&&requestAnimationFrame(u)};var o=u;const i=s.target,a=parseInt(i.dataset.counter),r=i.dataset.suffix||"",l=2e3,c=performance.now();requestAnimationFrame(u),t.unobserve(i)}})},{threshold:.5});e.forEach(n=>t.observe(n))}function be(e){if(!e)return;const t=30;for(let n=0;n<t;n++){const s=document.createElement("div");s.classList.add("particle");const o=Math.random()*100,i=Math.random()*100,a=(Math.random()-.5)*200,r=-(Math.random()*300+100),l=Math.random()*3+1,c=Math.random()*6+4,u=Math.random()*8,p=Math.random()>.5?"188":"270";s.style.cssText=`
      left: ${o}%;
      bottom: ${i}%;
      width: ${l}px;
      height: ${l}px;
      --tx: ${a}px;
      --ty: ${r}px;
      animation-duration: ${c}s;
      animation-delay: ${u}s;
      background: hsl(${p}, 100%, 60%);
      box-shadow: 0 0 ${l*3}px hsl(${p}, 100%, 60%);
    `,e.appendChild(s)}}function xe(){const e=document.querySelectorAll("[data-parallax]");if(!e.length)return;function t(){const n=window.scrollY;e.forEach(s=>{const o=parseFloat(s.dataset.parallax)||.5;s.style.transform=`translateY(${n*o}px)`})}window.addEventListener("scroll",t,{passive:!0})}function Se(){const e=document.getElementById("ambient-glow");if(!e)return;let t=!1;window.addEventListener("mousemove",n=>{t||(t=!0,requestAnimationFrame(()=>{e.style.transform=`translate(${n.clientX-300}px, ${n.clientY-300}px)`,t=!1}))},{passive:!0}),document.documentElement.addEventListener("mouseleave",()=>{e.style.opacity="0"}),document.documentElement.addEventListener("mouseenter",()=>{e.style.opacity="1"})}function $e(){ge(),ye(),he(),xe(),Se();const e=document.querySelector(".particles-container");e&&be(e)}let q=null;function we(){return q||(q=document.createElement("div"),q.className="toast-container",document.body.appendChild(q)),q}function x(e,t="success",n=3500){const s=we(),o={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"},i=document.createElement("div");i.className=`toast ${t}`,i.innerHTML=`
    <span class="toast-icon">${o[t]||o.info}</span>
    <span class="toast-message">${e}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `,s.appendChild(i),setTimeout(()=>{i.style.animation="fade-out 0.3s ease forwards",setTimeout(()=>i.remove(),300)},n)}const ee="obj3d_registered_emails",Le="obj3d_discount_code";function Ee(){const e="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let t="OBJ3D-";for(let n=0;n<6;n++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}function R(e){if(!e||!e.includes("@"))return x("Veuillez entrer un email valide.","error"),null;const t=te();if(t.find(s=>s.email===e))return x("Cet email est déjà inscrit !","warning"),null;const n=Ee();return t.push({email:e,date:new Date().toISOString(),discountCode:n}),localStorage.setItem(ee,JSON.stringify(t)),localStorage.setItem(Le,n),De("registrations",{email:e,date:new Date().toISOString(),code:n}),x(`🎉 Code promo: ${n} (-${E.discountPercent}%)`,"success",6e3),n}function te(){try{return JSON.parse(localStorage.getItem(ee))||[]}catch{return[]}}function De(e,t){const n=`obj3d_admin_${e}`;try{const s=JSON.parse(localStorage.getItem(n))||[];s.push(t),localStorage.setItem(n,JSON.stringify(s))}catch{localStorage.setItem(n,JSON.stringify([t]))}}function Ie(){const e=document.querySelector(".discount-popup");if(!e)return;const t=sessionStorage.getItem("obj3d_popup_dismissed"),n=te();if(t||n.length>0)return;setTimeout(()=>{e.classList.add("active")},25e3);const s=e.querySelector(".discount-close");s&&s.addEventListener("click",()=>{e.classList.remove("active"),sessionStorage.setItem("obj3d_popup_dismissed","true")});const o=e.querySelector(".discount-form");o&&o.addEventListener("submit",i=>{i.preventDefault();const a=o.querySelector('input[type="email"]');a&&R(a.value)&&(e.classList.remove("active"),sessionStorage.setItem("obj3d_popup_dismissed","true"))})}const O="obj3d_admin_demos";function V(e){try{const t=JSON.parse(localStorage.getItem(O))||[];t.push({...e,id:Date.now(),date:new Date().toISOString(),status:"pending"}),localStorage.setItem(O,JSON.stringify(t))}catch{localStorage.setItem(O,JSON.stringify([e]))}}async function z(e){if(typeof emailjs<"u")try{await emailjs.send("YOUR_SERVICE_ID","YOUR_TEMPLATE_ID",{product_name:e.productName,customer_email:e.email,details:JSON.stringify(e.details,null,2),date:new Date().toLocaleDateString("fr-FR")},"YOUR_PUBLIC_KEY")}catch(t){console.error("EmailJS error:",t)}}function Te(){const e=document.getElementById("demo-form-dual-text");e&&e.addEventListener("submit",async t=>{t.preventDefault();const n=e.querySelector("#demo-text1").value.trim(),s=e.querySelector("#demo-text2").value.trim(),o=e.querySelector("#demo-email").value.trim();if(!n||!s||!o){x("Veuillez remplir tous les champs.","error");return}const i={productId:"dual-text",productName:"Dual Texte Illusion 3D",email:o,details:{text1:n,text2:s}};V(i),await z(i),x("✨ Demande de démo envoyée ! Nous vous recontacterons par email.","success",5e3),e.reset(),I(o,"demo_request",`Demande de démo Dual Texte: "${n}" / "${s}"`)})}function qe(){const e=document.getElementById("demo-form-3d-map");e&&e.addEventListener("submit",async t=>{var a;t.preventDefault();const n=e.querySelector("#demo-location").value.trim(),s=e.querySelector("#demo-email").value.trim(),o=((a=e.querySelector("#demo-notes"))==null?void 0:a.value.trim())||"";if(!n||!s){x("Veuillez remplir tous les champs obligatoires.","error");return}const i={productId:"3d-map",productName:"Map 3D de Lieu",email:s,details:{location:n,notes:o}};V(i),await z(i),x("🗺️ Demande de démo envoyée ! Nous vous recontacterons par email.","success",5e3),e.reset(),I(s,"demo_request",`Demande de démo Map 3D: "${n}"`)})}function ke(){const e=document.getElementById("demo-form-gpx");if(!e)return;const t=e.querySelector(".drop-zone"),n=e.querySelector("#demo-gpx-file");let s=null;if(t&&n){let i=function(a){if(!a)return;if(!a.name.toLowerCase().endsWith(".gpx")){x("Veuillez sélectionner un fichier .gpx","error");return}s=a;const r=t.querySelector(".drop-text");r&&(r.innerHTML=`<span class="file-selected">📎 ${a.name}</span>`),x(`Fichier "${a.name}" sélectionné`,"success")};var o=i;t.addEventListener("click",()=>n.click()),["dragenter","dragover"].forEach(a=>{t.addEventListener(a,r=>{r.preventDefault(),t.classList.add("dragover")})}),["dragleave","drop"].forEach(a=>{t.addEventListener(a,r=>{r.preventDefault(),t.classList.remove("dragover")})}),t.addEventListener("drop",a=>{const r=a.dataTransfer.files[0];i(r)}),n.addEventListener("change",a=>{i(a.target.files[0])})}e.addEventListener("submit",async i=>{i.preventDefault();const a=e.querySelector("#demo-email").value.trim();if(!s||!a){x("Veuillez fournir un fichier GPX et votre email.","error");return}const r=new FileReader;r.onload=async l=>{const c={productId:"gpx-map",productName:"Map 3D depuis GPX",email:a,details:{fileName:s.name,fileSize:s.size,fileContent:l.target.result.substring(0,5e3)}};V(c),await z(c),x("📍 Demande de démo envoyée ! Nous vous recontacterons par email.","success",5e3),e.reset(),s=null;const u=t==null?void 0:t.querySelector(".drop-text");u&&(u.textContent="Glissez votre fichier GPX ici ou cliquez pour parcourir"),I(a,"demo_request",`Demande de démo GPX: "${s==null?void 0:s.name}"`)},r.readAsText(s)})}function I(e,t,n){const s="obj3d_admin_tunnel";try{const o=JSON.parse(localStorage.getItem(s))||[];o.push({id:Date.now(),email:e,type:t,description:n,date:new Date().toISOString()}),localStorage.setItem(s,JSON.stringify(o))}catch{}}function Ce(){const e=document.getElementById("checkout-form");e&&(Ne(),e.addEventListener("submit",async t=>{var c,u;t.preventDefault();const n=e.querySelector("#checkout-firstname").value.trim(),s=e.querySelector("#checkout-lastname").value.trim(),o=e.querySelector("#checkout-email").value.trim(),i=((c=e.querySelector("#checkout-phone"))==null?void 0:c.value.trim())||"",a=((u=e.querySelector("#checkout-address"))==null?void 0:u.value.trim())||"";if(!n||!s||!o){x("Veuillez remplir les champs obligatoires.","error");return}if(m.items.length===0){x("Votre panier est vide.","error");return}const r={id:"ORD-"+Date.now(),date:new Date().toISOString(),customer:{firstName:n,lastName:s,email:o,phone:i,address:a},items:[...m.items],subtotal:m.getSubtotal(),discount:m.getDiscountAmount(),total:m.getTotal(),status:"pending",paymentMethod:"pending"};P(r),I(o,"order_placed",`Commande ${r.id} - ${r.total.toFixed(2)}€ - ${r.items.map(p=>p.name).join(", ")}`),document.getElementById("stripe-pay-btn")?(x("🔒 Redirection vers le paiement sécurisé...","info",3e3),setTimeout(()=>{r.status="paid",r.paymentMethod="stripe_simulated",P(r,!0),I(o,"payment_received",`Paiement reçu pour ${r.id} - ${r.total.toFixed(2)}€`),m.clear(),D(),W(r)},2e3)):(r.status="reserved",r.paymentMethod="reservation",P(r,!0),I(o,"reservation",`Réservation ${r.id} - ${r.total.toFixed(2)}€`),m.clear(),D(),W(r))}))}function P(e,t=!1){const n="obj3d_admin_orders";try{let s=JSON.parse(localStorage.getItem(n))||[];t&&(s=s.filter(o=>o.id!==e.id)),s.push(e),localStorage.setItem(n,JSON.stringify(s))}catch{localStorage.setItem(n,JSON.stringify([e]))}}function W(e){const t=document.querySelector(".checkout-container .container");t&&(t.innerHTML=`
      <div class="text-center" style="padding: var(--space-20) 0;">
        <div style="font-size: 5rem; margin-bottom: var(--space-6);">🎉</div>
        <h1>Commande Confirmée !</h1>
        <p style="font-size: var(--text-lg); margin: var(--space-4) 0;">
          Votre commande <strong style="color: var(--color-accent-cyan);">${e.id}</strong> a été enregistrée.
        </p>
        <p>Un email de confirmation sera envoyé à <strong>${e.customer.email}</strong></p>
        <div style="margin-top: var(--space-8);">
          <a href="/products.html" class="btn btn-primary btn-lg">Continuer mes achats</a>
        </div>
      </div>
    `)}function Ne(){const e=document.getElementById("checkout-summary-items");if(!e)return;if(m.items.length===0){e.innerHTML='<p style="text-align: center; padding: var(--space-6);">Votre panier est vide.</p>';return}e.innerHTML=m.items.map(n=>`
    <div style="display: flex; justify-content: space-between; padding: var(--space-3) 0; border-bottom: var(--border-subtle);">
      <div>
        <span style="margin-right: var(--space-2);">${n.icon}</span>
        <strong>${n.name}</strong>
        <span style="color: var(--color-text-muted);"> × ${n.quantity}</span>
        <br><small style="color: var(--color-text-muted);">${n.optionLabel}</small>
      </div>
      <span style="font-weight: 700; color: var(--color-accent-cyan);">${(n.price*n.quantity).toFixed(2)}€</span>
    </div>
  `).join("");const t=document.getElementById("checkout-totals");if(t){let n=`
      <div class="summary-row">
        <span>Sous-total</span>
        <span>${m.getSubtotal().toFixed(2)}€</span>
      </div>
    `;m.discount&&(n+=`
        <div class="summary-row" style="color: var(--color-accent-green);">
          <span>Réduction (${m.discount.percent}%)</span>
          <span>-${m.getDiscountAmount().toFixed(2)}€</span>
        </div>
      `),n+=`
      <div class="summary-row total">
        <span>Total</span>
        <span class="amount">${m.getTotal().toFixed(2)}€</span>
      </div>
    `,t.innerHTML=n}}const A="obj3d_admin_auth",C={orders:"obj3d_admin_orders",demos:"obj3d_admin_demos",registrations:"obj3d_admin_registrations",tunnel:"obj3d_admin_tunnel",pageviews:"obj3d_admin_pageviews"};function ne(){const e={page:window.location.pathname||"/",timestamp:Date.now(),device:/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile":"desktop",referrer:document.referrer||"direct"},t=y("pageviews");t.push(e),t.length>5e3&&t.splice(0,t.length-5e3),M("pageviews",t)}function y(e){try{return JSON.parse(localStorage.getItem(C[e]))||[]}catch{return[]}}function M(e,t){localStorage.setItem(C[e],JSON.stringify(t))}function J(e){if(!e)return"—";const t=new Date(e);return isNaN(t)?"—":t.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"})}function se(e){if(!e)return"—";const t=new Date(e);return isNaN(t)?"—":t.toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}function N(e){return isNaN(e)||e==null?"0,00€":Number(e).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+"€"}function d(e){return document.getElementById(e)}function $(e,t="info"){const n=d("admin-toast");n&&(n.textContent=e,n.className=`admin-toast ${t} show`,clearTimeout(n._t),n._t=setTimeout(()=>{n.classList.remove("show")},3500))}function Me(){var s,o,i,a;ne();const e=d("admin-login"),t=d("admin-shell"),n=d("admin-login-form");!e||!t||!n||(sessionStorage.getItem(A)==="true"&&Q(e,t),n.addEventListener("submit",r=>{r.preventDefault();const l=d("admin-password").value,c=d("login-error");l===E.adminPassword?(sessionStorage.setItem(A,"true"),Q(e,t)):(c&&(c.style.display="block"),d("admin-password").style.borderColor="rgba(224,64,251,0.5)",setTimeout(()=>{d("admin-password").style.borderColor=""},2e3))}),(s=d("admin-logout"))==null||s.addEventListener("click",()=>{sessionStorage.removeItem(A),t.classList.remove("visible"),t.style.display="none",e.style.display="flex",$("Déconnexion réussie.","info")}),(o=d("sidebar-toggle"))==null||o.addEventListener("click",()=>j(!0)),(i=d("sidebar-overlay"))==null||i.addEventListener("click",()=>j(!1)),document.querySelectorAll(".admin-nav-item").forEach(r=>{r.addEventListener("click",()=>{const l=r.dataset.tab;U(l),j(!1)})}),(a=d("overview-refresh"))==null||a.addEventListener("click",oe))}function j(e){const t=d("admin-sidebar"),n=d("sidebar-overlay");t&&(e?(t.classList.add("open"),n==null||n.classList.add("show")):(t.classList.remove("open"),n==null||n.classList.remove("show")))}function Q(e,t){e.style.display="none",t.style.display="flex",t.classList.add("visible"),oe(),U("overview")}function U(e){document.querySelectorAll(".admin-nav-item").forEach(s=>{s.classList.toggle("active",s.dataset.tab===e)}),document.querySelectorAll(".admin-panel").forEach(s=>{s.classList.remove("active")});const t=`panel-${e}`,n=d(t);switch(n&&n.classList.add("active"),e){case"overview":_e();break;case"tunnel":je();break;case"orders":ae();break;case"demos":ie();break;case"emails":Re();break;case"traffic":Be();break;case"settings":He();break}}function oe(){var r;const e=y("orders"),t=y("demos"),n=y("registrations"),s=d("badge-orders"),o=d("badge-demos"),i=d("badge-emails");s&&(s.textContent=e.length),o&&(o.textContent=t.length),i&&(i.textContent=n.length);const a=((r=document.querySelector(".admin-nav-item.active"))==null?void 0:r.dataset.tab)||"overview";U(a)}function _e(){const e=y("orders"),t=y("demos"),n=y("registrations"),s=y("pageviews"),o=e.reduce((r,l)=>r+(Number(l.total)||0),0),i=e.length>0?o/e.length:0,a=s.length>0?(e.length/s.length*100).toFixed(2):"0.00";w("kpi-revenue",N(o)),w("kpi-orders",e.length),w("kpi-demos",t.length),w("kpi-leads",n.length),w("kpi-conv",a+"%"),w("kpi-avg-order",N(i)),Oe(e,t,n,s),Pe(e),Ae()}function w(e,t){const n=d(e);n&&(n.textContent=t)}function Oe(e,t,n,s){const o=d("funnel-visual");if(!o)return;const i=[{name:"Visiteurs",count:s.length,icon:"👁️"},{name:"Fiche produit",count:s.filter(r=>r.page&&r.page.includes("product")).length,icon:"🛍️"},{name:"Aperçu demandé",count:t.length,icon:"🔍"},{name:"Commande",count:e.length,icon:"📦"},{name:"Paiement",count:e.filter(r=>r.status==="paid"||r.status==="completed"||r.status==="shipped").length,icon:"💰"}],a=Math.max(...i.map(r=>r.count),1);o.innerHTML=i.map((r,l)=>{const c=l>0?i[l-1].count:r.count,u=c>0?Math.round(r.count/c*100):100,p=l>0&&u<40,b=Math.max(5,Math.round(r.count/a*100));return`
      <div class="funnel-step">
        <div class="funnel-step-body">
          <div class="funnel-step-name">${r.icon} ${r.name}</div>
          <div class="funnel-step-count">${r.count.toLocaleString("fr-FR")}</div>
          <div class="funnel-step-conv ${p?"warn":""}">
            ${l===0?"100%":(p?"⚠️ ":"")+u+"%"}
          </div>
        </div>
        <div class="funnel-bar-row"><div class="funnel-bar-fill" style="width:${b}%"></div></div>
        ${l<i.length-1?'<div class="funnel-arrow"></div>':""}
      </div>
    `}).join("")}function Pe(e){const t=d("product-breakdown");if(!t)return;const n=[{id:"dual-text",name:"🔤 Dual Texte",color:"var(--gradient-primary)"},{id:"3d-map",name:"🗺️ Map Lieu",color:"var(--gradient-gold)"},{id:"gpx-map",name:"📍 Map GPX",color:"var(--gradient-green)"}],s={};n.forEach(i=>{s[i.id]=0}),e.forEach(i=>{(i.items||[]).forEach(a=>{a.id&&s[a.id]!==void 0?s[a.id]+=a.quantity||1:n.forEach(r=>{(a.name||"").toLowerCase().includes(r.id.replace("-"," "))&&(s[r.id]+=a.quantity||1)})})});const o=Math.max(...Object.values(s),1);if(e.length===0){t.innerHTML='<p style="color:var(--color-text-muted);font-size:0.875rem;text-align:center;padding:2rem">Aucune donnée</p>';return}t.innerHTML=n.map(i=>`
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">${i.name}</span>
        <span class="bar-value">${s[i.id]} cmd</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round(s[i.id]/o*100)}%;background:${i.color}"></div>
      </div>
    </div>
  `).join("")}function Ae(){const e=d("recent-activity");if(!e)return;const t=y("tunnel"),n=y("orders"),s=y("registrations"),o=[];t.slice(-10).forEach(a=>{o.push({ts:new Date(a.date||a.timestamp||Date.now()).getTime(),icon:re(a.type),title:ce(a.type),desc:a.email?`📧 ${a.email}`:a.description||""})}),n.slice(-3).forEach(a=>{var r,l;t.find(c=>{var u;return c.type==="order_placed"&&c.email===((u=a.customer)==null?void 0:u.email)})||o.push({ts:new Date(a.date||Date.now()).getTime(),icon:"📦",title:"Nouvelle commande",desc:`${((r=a.customer)==null?void 0:r.firstName)||""} ${((l=a.customer)==null?void 0:l.lastName)||""} — ${N(a.total)}`})}),s.slice(-3).forEach(a=>{t.find(r=>r.type==="registration"&&r.email===a.email)||o.push({ts:new Date(a.date||a.timestamp||Date.now()).getTime(),icon:"📧",title:"Inscription email",desc:a.email||""})}),o.sort((a,r)=>r.ts-a.ts);const i=o.slice(0,5);if(i.length===0){e.innerHTML='<div class="activity-empty">🕊️<br>Aucune activité récente</div>';return}e.innerHTML=i.map(a=>`
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-title">${a.icon} ${a.title}</div>
        <div class="activity-time">${a.desc}</div>
        <div class="activity-time text-muted">${se(a.ts)}</div>
      </div>
    </div>
  `).join("")}function je(){var a,r,l;const e=y("tunnel"),t=y("orders"),n=y("demos");y("registrations");const s=y("pageviews"),o=[{num:1,label:"Visiteurs",key:"pageview",count:s.length,color:"#2eccd6"},{num:2,label:"Fiche produit",key:"product_view",count:s.filter(c=>{var u;return(u=c.page)==null?void 0:u.includes("product")}).length,color:"#1a7abf"},{num:3,label:"Aperçu demandé",key:"demo_request",count:n.length,color:"#e040fb"},{num:4,label:"Commande",key:"order_placed",count:t.length,color:"#f5a623"},{num:5,label:"Paiement reçu",key:"payment",count:t.filter(c=>["paid","shipped","completed"].includes(c.status)).length,color:"#00e676"}],i=d("tunnel-step-cards");i&&(i.innerHTML=o.map((c,u)=>{const p=u===0?c.count:o[u-1].count,b=p>0?Math.round(c.count/p*100):100,v=100-b,S=u>0&&v>60;return`
        <div class="tunnel-card ${S?"warn-card":""}">
          <div class="tunnel-card-header">
            <div class="tunnel-step-info">
              <div class="tunnel-step-num">${c.num}</div>
              <div class="tunnel-step-label">${c.label}</div>
            </div>
            ${S?'<span class="status-badge badge-pending">⚠️ Chute importante</span>':""}
          </div>
          <div class="tunnel-meta">
            <div class="tunnel-meta-item">
              <div class="tunnel-meta-value" style="color:${c.color}">${c.count.toLocaleString("fr-FR")}</div>
              <div class="tunnel-meta-label">Utilisateurs</div>
            </div>
            <div class="tunnel-meta-item">
              <div class="tunnel-meta-value" style="color:${c.color}">${u===0?"100%":b+"%"}</div>
              <div class="tunnel-meta-label">Taux conv.</div>
            </div>
            <div class="tunnel-meta-item">
              <div class="tunnel-meta-value" style="color:${c.color}">${u===0?"—":(p-c.count).toLocaleString("fr-FR")}</div>
              <div class="tunnel-meta-label">Abandons</div>
            </div>
          </div>
          ${S?`
            <div class="drop-warn">
              ⚠️ ${v}% des utilisateurs abandonnent à cette étape — optimisation recommandée
            </div>
          `:""}
        </div>
      `}).join("")),B(e),(a=d("tunnel-type-filter"))==null||a.addEventListener("change",()=>Z(e)),(r=d("tunnel-date-filter"))==null||r.addEventListener("change",()=>Z(e)),(l=d("tunnel-filter-reset"))==null||l.addEventListener("click",()=>{const c=d("tunnel-type-filter"),u=d("tunnel-date-filter");c&&(c.value=""),u&&(u.value=""),B(e)})}function Z(e){var o,i;const t=(o=d("tunnel-type-filter"))==null?void 0:o.value,n=(i=d("tunnel-date-filter"))==null?void 0:i.value;let s=[...e];if(t&&(s=s.filter(a=>a.type===t)),n){const a=new Date(n);s=s.filter(r=>new Date(r.date||r.timestamp||0).toDateString()===a.toDateString())}B(s)}function B(e){const t=d("tunnel-timeline");if(!t)return;const n=[...e].reverse().slice(0,50);if(n.length===0){t.innerHTML='<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucun événement trouvé</p>';return}t.innerHTML=n.map(s=>`
    <div class="timeline-item">
      <div class="timeline-icon">${re(s.type)}</div>
      <div class="timeline-body">
        <div class="timeline-title">${ce(s.type)}</div>
        <div class="timeline-desc">${s.description||s.email||"—"}</div>
        <div class="timeline-meta">
          ${s.email?`<span>📧 ${s.email}</span>`:""}
          <span>🕐 ${se(s.date||s.timestamp)}</span>
          ${s.page?`<span>📄 ${s.page}</span>`:""}
        </div>
      </div>
    </div>
  `).join("")}function ae(){const e=y("orders"),t=d("orders-tbody"),n=d("orders-empty"),s=d("orders-status-filter");if(!t)return;const o=i=>{if(i.length===0){t.innerHTML="",n&&(n.style.display="flex");return}n&&(n.style.display="none"),t.innerHTML=[...i].reverse().map((a,r)=>{var p,b,v;const l=ze(a.status),c=(a.items||[]).map(S=>`${S.icon||""} ${S.name} ×${S.quantity||1}`).join("<br>"),u=["pending","paid"].includes(a.status);return`
        <tr>
          <td><strong style="color:var(--color-accent-cyan);font-family:monospace">${a.id||"#"+(r+1)}</strong></td>
          <td>${J(a.date)}</td>
          <td>
            <strong>${((p=a.customer)==null?void 0:p.firstName)||""} ${((b=a.customer)==null?void 0:b.lastName)||""}</strong><br>
            <small style="color:var(--color-text-muted)">${((v=a.customer)==null?void 0:v.email)||"—"}</small>
          </td>
          <td style="font-size:0.78rem">${c||"—"}</td>
          <td><strong>${N(a.total)}</strong></td>
          <td>${l}</td>
          <td>
            ${u?`<button class="btn btn-secondary btn-xs" data-ship="${a.id}">🚚 Expédier</button>`:""}
          </td>
        </tr>
      `}).join(""),t.querySelectorAll("[data-ship]").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.ship;Fe(r)})})};o(e),s==null||s.addEventListener("change",()=>{const i=s.value,a=i?e.filter(r=>r.status===i):e;o(a)})}function Fe(e){const t=y("orders"),n=t.findIndex(s=>s.id===e);n!==-1&&(t[n].status="shipped",M("orders",t),$(`✅ Commande ${e} marquée comme expédiée`,"success"),ae())}function ie(){const e=y("demos"),t=d("demos-tbody"),n=d("demos-empty");if(!t)return;const s=r=>{if(r.length===0){t.innerHTML="",n&&(n.style.display="flex");return}n&&(n.style.display="none"),t.innerHTML=[...r].reverse().map((l,c)=>{const u=!l.status||l.status==="pending",p=Je(l.details);return`
        <tr>
          <td>${J(l.date||l.timestamp)}</td>
          <td><span class="status-badge badge-new">${l.productName||l.product||"—"}</span></td>
          <td style="color:var(--color-text-primary)">${l.email||"—"}</td>
          <td style="font-size:0.78rem;max-width:220px">${p}</td>
          <td>
            <span class="status-badge ${u?"badge-pending":"badge-treated"}">
              ${u?"En attente":"Traité"}
            </span>
          </td>
          <td>
            ${u?`<button class="btn btn-ghost btn-xs" data-treat="${c}">✅ Traité</button>`:""}
          </td>
        </tr>
      `}).join(""),t.querySelectorAll("[data-treat]").forEach(l=>{l.addEventListener("click",()=>{const c=e.length-1-parseInt(l.dataset.treat);e[c]&&(e[c].status="treated",M("demos",e),$("✅ Demande marquée comme traitée","success"),ie())})})},o=d("demos-product-filter"),i=d("demos-status-filter"),a=()=>{const r=(o==null?void 0:o.value)||"",l=(i==null?void 0:i.value)||"";let c=[...e];r&&(c=c.filter(u=>(u.product||u.productName||"").toLowerCase().includes(r))),l&&(c=c.filter(u=>l==="treated"?u.status==="treated":!u.status||u.status==="pending")),s(c)};s(e),o==null||o.addEventListener("change",a),i==null||i.addEventListener("change",a)}function Re(){var s;const e=y("registrations"),t=d("emails-tbody"),n=d("emails-empty");t&&(e.length===0?(t.innerHTML="",n&&(n.style.display="flex")):(n&&(n.style.display="none"),t.innerHTML=[...e].reverse().map(o=>`
      <tr>
        <td style="color:var(--color-text-primary)">${o.email||"—"}</td>
        <td>${J(o.date||o.timestamp)}</td>
        <td><span class="status-badge badge-new">${o.source||"Newsletter"}</span></td>
        <td><code style="color:var(--color-accent-green);font-size:0.78rem">${o.code||o.discountCode||"N/A"}</code></td>
        <td><span class="status-badge badge-paid">Actif</span></td>
      </tr>
    `).join("")),(s=d("export-emails-csv"))==null||s.addEventListener("click",()=>H(e,"leads",["email","date","source","code"])))}function Be(){const e=y("pageviews"),t=[...new Set(e.map(g=>g.page))],n=new Date().toDateString(),s=e.filter(g=>new Date(g.timestamp).toDateString()===n);w("traffic-total",e.length),w("traffic-pages",t.length),w("traffic-today",s.length);const o={},i={};e.forEach(g=>{const f=g.page||"/";o[f]=(o[f]||0)+1,i[f]||(i[f]={mobile:0,desktop:0}),i[f][g.device==="mobile"?"mobile":"desktop"]++});const a=Object.entries(o).sort((g,f)=>f[1]-g[1]).slice(0,8),r=d("traffic-pages-table");r&&(a.length===0?r.innerHTML='<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:1.5rem">Aucune donnée</td></tr>':r.innerHTML=a.map(([g,f])=>{const h=i[g]||{},L=(h.mobile||0)>=(h.desktop||0)?"📱":"💻";return`
          <tr>
            <td><code style="color:var(--color-accent-cyan);font-size:0.75rem">${g}</code></td>
            <td><strong>${f}</strong></td>
            <td>${L}</td>
          </tr>
        `}).join(""));const l=e.filter(g=>g.device==="mobile").length,c=e.length-l,u=e.length>0?Math.round(l/e.length*100):0,p=100-u;w("donut-mobile-pct",u+"%"),w("donut-mobile-label",u+"% ("+l+")"),w("donut-desktop-label",p+"% ("+c+")");const b=d("donut-mobile-arc"),v=d("donut-desktop-arc");if(b&&v){const f=u,h=p;setTimeout(()=>{b.setAttribute("stroke-dasharray",`${f} ${100-f}`),b.setAttribute("stroke-dashoffset","25"),v.setAttribute("stroke-dasharray",`${h} ${100-h}`),v.setAttribute("stroke-dashoffset",`${25-f}`)},100)}const S={};e.forEach(g=>{let f=g.referrer||"direct";try{f&&f!=="direct"&&(f=new URL(f).hostname)}catch{f="direct"}S[f]=(S[f]||0)+1});const T=d("referrers-table");if(T){const g=Object.entries(S).sort((f,h)=>h[1]-f[1]).slice(0,8);g.length===0?T.innerHTML='<tr><td colspan="2" style="text-align:center;color:var(--color-text-muted);padding:1.5rem">Aucun référent</td></tr>':T.innerHTML=g.map(([f,h])=>`
        <tr>
          <td>${f==="direct"?"🏠 Accès direct":`🔗 ${f}`}</td>
          <td><strong>${h}</strong></td>
        </tr>
      `).join("")}const Y=d("weekly-sparkline"),X=d("weekly-labels");if(Y){const g=[];for(let h=6;h>=0;h--){const L=new Date;L.setDate(L.getDate()-h);const le=L.toDateString(),de=e.filter(ue=>new Date(ue.timestamp).toDateString()===le).length;g.push({label:L.toLocaleDateString("fr-FR",{weekday:"short"}),count:de})}const f=Math.max(...g.map(h=>h.count),1);Y.innerHTML=g.map(h=>`<div class="sparkline-bar" style="height:${Math.max(5,Math.round(h.count/f*100))}%" title="${h.count} vues"></div>`).join(""),X&&(X.innerHTML=g.map(h=>`<span class="sparkline-label">${h.label}</span>`).join(""))}}function He(){var s,o,i,a,r;const e=d("info-sitename"),t=d("info-email"),n=d("info-discount");e&&(e.value=E.siteName),t&&(t.value="contact@voxel3d.fr"),n&&(n.value=E.discountPercent+"%"),(s=d("change-password-btn"))==null||s.addEventListener("click",()=>{var p,b,v;const l=(p=d("current-password"))==null?void 0:p.value,c=(b=d("new-password"))==null?void 0:b.value,u=(v=d("confirm-password"))==null?void 0:v.value;if(!l||l!==E.adminPassword){$("❌ Mot de passe actuel incorrect","error");return}if(!c||c.length<6){$("❌ Nouveau mot de passe trop court (min. 6 caractères)","error");return}if(c!==u){$("❌ Les mots de passe ne correspondent pas","error");return}E.adminPassword=c,$("✅ Mot de passe mis à jour (session courante)","success"),d("current-password").value="",d("new-password").value="",d("confirm-password").value=""}),(o=d("export-json-btn"))==null||o.addEventListener("click",()=>{const l={};Object.keys(C).forEach(c=>{l[c]=y(c)}),l.exportedAt=new Date().toISOString(),Ve(l,"voxelprint_export.json"),$("✅ Export JSON téléchargé","success")}),(i=d("export-orders-csv-btn"))==null||i.addEventListener("click",()=>{H(y("orders"),"commandes",["id","date","customer.email","total","status"])}),(a=d("export-leads-csv-btn"))==null||a.addEventListener("click",()=>{H(y("registrations"),"leads",["email","date","source","code"])}),document.querySelectorAll("[data-clear]").forEach(l=>{l.addEventListener("click",()=>{const c=l.dataset.clear;confirm(`Supprimer les données "${c}" ? Cette action est irréversible.`)&&(M(c,[]),$(`🗑️ Données "${c}" supprimées`,"info"))})}),(r=d("clear-all-btn"))==null||r.addEventListener("click",()=>{confirm("ATTENTION : Supprimer TOUTES les données VoxelPrint du localStorage ? Cette action est irréversible.")&&confirm("Êtes-vous vraiment sûr ? Il n'y a pas de retour en arrière possible.")&&(Object.values(C).forEach(l=>localStorage.removeItem(l)),$("💥 Toutes les données ont été supprimées","info"))})}function H(e,t,n){if(!e||e.length===0){$("⚠️ Aucune donnée à exporter","info");return}const s=(u,p)=>{const b=p.split(".");let v=u;for(const S of b)v=v==null?void 0:v[S];return v==null?"":v instanceof Date?v.toISOString():String(v).replace(/"/g,'""')},o=n.join(","),i=e.map(u=>n.map(p=>`"${s(u,p)}"`).join(",")),a=[o,...i].join(`
`),r=new Blob(["\uFEFF"+a],{type:"text/csv;charset=utf-8;"}),l=URL.createObjectURL(r),c=document.createElement("a");c.href=l,c.download=`voxelprint_${t}_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(l),$(`✅ CSV exporté (${e.length} entrées)`,"success")}function Ve(e,t){const n=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),s=URL.createObjectURL(n),o=document.createElement("a");o.href=s,o.download=t,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s)}function re(e){return{demo_request:"🔍",order_placed:"🛒",payment_received:"💰",reservation:"📋",registration:"📧",pageview:"👁️",product_view:"🛍️"}[e]||"📌"}function ce(e){return{demo_request:"Demande d'aperçu",order_placed:"Nouvelle commande",payment_received:"Paiement reçu",reservation:"Réservation",registration:"Inscription email",pageview:"Page visitée",product_view:"Fiche produit vue"}[e]||e}function ze(e){return{paid:'<span class="status-badge badge-paid">Payé</span>',pending:'<span class="status-badge badge-pending">En attente</span>',shipped:'<span class="status-badge badge-shipped">Expédié</span>',cancelled:'<span class="status-badge badge-cancelled">Annulé</span>',completed:'<span class="status-badge badge-paid">Terminé</span>',reserved:'<span class="status-badge badge-new">Réservé</span>'}[e]||`<span class="status-badge badge-pending">${e||"—"}</span>`}function Je(e){if(!e)return'<span style="color:var(--color-text-muted)">N/A</span>';const t=[];return e.text1&&t.push(`Texte 1: <strong>"${e.text1}"</strong>`),e.text2&&t.push(`Texte 2: <strong>"${e.text2}"</strong>`),e.location&&t.push(`Lieu: <strong>"${e.location}"</strong>`),e.fileName&&t.push(`Fichier: <strong>${e.fileName}</strong>`),e.notes&&t.push(`Notes: ${e.notes}`),t.join("<br>")||'<span style="color:var(--color-text-muted)">N/A</span>'}document.addEventListener("DOMContentLoaded",()=>{ne(),Ue(),ve(),$e(),Ie(),Xe(),Ye(),document.body.classList.add("page-enter");const e=window.location.pathname;e==="/"||e==="/index.html"||e.endsWith("/index.html")||e===""?Ge():e.includes("product-dual-text")?(F("dual-text"),Te()):e.includes("product-3d-map")?(F("3d-map"),qe()):e.includes("product-gpx-map")?(F("gpx-map"),ke()):e.includes("cart")?Ke():e.includes("checkout")?Ce():e.includes("admin")&&Me()});function Ue(){const e=document.querySelector(".nav"),t=document.querySelector(".nav-mobile-toggle"),n=document.querySelector(".nav-links");e&&(window.addEventListener("scroll",()=>{e.classList.toggle("scrolled",window.scrollY>30)},{passive:!0}),window.scrollY>30&&e.classList.add("scrolled")),t&&n&&(t.addEventListener("click",()=>{n.classList.toggle("active"),t.classList.toggle("active")}),n.querySelectorAll("a").forEach(s=>{s.addEventListener("click",()=>{n.classList.remove("active"),t.classList.remove("active")})}))}function Ye(){const e=document.getElementById("ticker");if(!e)return;const t=e.innerHTML;e.innerHTML+=t}function Xe(){const e=document.querySelectorAll(".faq-item");e.forEach(t=>{const n=t.querySelector(".faq-question");n&&n.addEventListener("click",()=>{const s=t.classList.contains("active");e.forEach(o=>o.classList.remove("active")),s||t.classList.add("active")})})}function Ge(){const e=document.getElementById("newsletter-form");e&&e.addEventListener("submit",n=>{n.preventDefault();const s=e.querySelector('input[type="email"]')||document.getElementById("optin-email");if(s&&s.value){const o=R(s.value);o&&(e.innerHTML=`
                        <div style="text-align:center;padding:var(--space-6);">
                            <div style="font-size:2.5rem;margin-bottom:var(--space-3);">🎉</div>
                            <p style="font-weight:700;color:var(--color-text-primary);margin-bottom:var(--space-2);">Guide envoyé !</p>
                            <p style="font-size:var(--text-sm);">Vérifiez votre boîte email. Votre code promo <strong style="color:var(--color-accent-cyan);">${o}</strong> est dedans.</p>
                        </div>
                    `)}});const t=document.getElementById("popup-form");t&&t.addEventListener("submit",n=>{var o;n.preventDefault();const s=t.querySelector('input[type="email"]');s&&s.value&&(R(s.value),(o=document.getElementById("discount-popup"))==null||o.classList.remove("active"))})}function F(e){const t=pe(e);if(!t)return;const n=document.getElementById("product-option"),s=document.getElementById("product-price-display");n&&s&&n.addEventListener("change",()=>{const i=t.options[n.value];i&&(s.textContent=i.price.toFixed(2)+"€")});const o=document.getElementById("add-to-cart-btn");o&&o.addEventListener("click",()=>{const i=parseInt((n==null?void 0:n.value)||"0");m.addItem(t,i),D(),x(`✅ "${t.name}" ajouté au panier !`,"success")})}function Ke(){k()}function k(){var t,n;const e=document.getElementById("cart-content");if(e){if(m.items.length===0){e.innerHTML=`
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h2>Votre panier est vide</h2>
                <p style="margin-bottom:var(--space-8);">Découvrez nos créations 3D uniques et personnalisables.</p>
                <a href="/products.html" class="btn btn-primary btn-lg">🎨 Découvrir nos créations</a>
            </div>
        `;return}e.innerHTML=`
        <div class="cart-layout">
            <div class="cart-items">
                ${m.items.map((s,o)=>`
                    <div class="cart-item" style="animation:fade-in 0.3s ease ${o*80}ms both;">
                        <div class="cart-item-image">${s.icon}</div>
                        <div class="cart-item-info">
                            <h4>${s.name}</h4>
                            <p>${s.optionLabel}</p>
                        </div>
                        <div class="quantity-controls">
                            <button data-action="qty" data-idx="${o}" data-q="${s.quantity-1}">−</button>
                            <span>${s.quantity}</span>
                            <button data-action="qty" data-idx="${o}" data-q="${s.quantity+1}">+</button>
                        </div>
                        <div class="cart-item-price">${(s.price*s.quantity).toFixed(2)}€</div>
                        <span class="cart-item-remove" data-action="del" data-idx="${o}">✕</span>
                    </div>
                `).join("")}
            </div>

            <div class="cart-summary">
                <h3>Résumé de commande</h3>
                <div class="summary-row">
                    <span>Sous-total</span>
                    <span>${m.getSubtotal().toFixed(2)}€</span>
                </div>
                <div class="summary-row">
                    <span>Livraison</span>
                    <span style="color:var(--color-accent-green);">${m.getSubtotal()>=49?"Offerte 🎉":"4,90€"}</span>
                </div>
                ${m.discount?`
                    <div class="summary-row" style="color:var(--color-accent-green);">
                        <span>Réduction (${m.discount.percent}%)</span>
                        <span>-${m.getDiscountAmount().toFixed(2)}€</span>
                    </div>
                `:""}
                <div class="discount-input-wrap">
                    <input type="text" id="discount-code-input" placeholder="Code promo" value="${((t=m.discount)==null?void 0:t.code)||""}">
                    <button class="btn btn-secondary btn-sm" id="apply-discount-btn">Appliquer</button>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span class="amount">${m.getTotal().toFixed(2)}€</span>
                </div>
                <a href="/checkout.html" class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4);">
                    🔒 Passer commande →
                </a>
                <a href="/products.html" class="btn btn-secondary btn-sm" style="width:100%;margin-top:var(--space-3);">
                    ← Continuer mes achats
                </a>
                <p style="font-size:var(--text-xs);color:var(--color-text-muted);text-align:center;margin-top:var(--space-3);">
                    ✅ Satisfait ou remboursé 30j · 🔒 Paiement sécurisé SSL
                </p>
            </div>
        </div>
    `,e.addEventListener("click",s=>{var a;const o=s.target.closest("[data-action]");if(!o)return;const i=parseInt(o.dataset.idx);if(o.dataset.action==="qty")m.updateQuantity(i,parseInt(o.dataset.q)),D(),k();else if(o.dataset.action==="del"){const r=(a=m.items[i])==null?void 0:a.name;m.removeItem(i),D(),k(),x(`"${r}" retiré du panier.`,"info")}}),(n=document.getElementById("apply-discount-btn"))==null||n.addEventListener("click",()=>{var o;const s=(o=document.getElementById("discount-code-input"))==null?void 0:o.value;s&&(m.applyDiscount(s)?(x("🎉 Code promo appliqué !","success"),k()):x("❌ Code promo invalide.","error"))})}}
