(function(){"use strict";var K,d,pe,T,fe,de,he,me,ee,te,ne,O={},ye=[],Qe=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,z=Array.isArray;function P(e,t){for(var n in t)e[n]=t[n];return e}function re(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function M(e,t,n){var r,o,i,l={};for(i in t)i=="key"?r=t[i]:i=="ref"?o=t[i]:l[i]=t[i];if(arguments.length>2&&(l.children=arguments.length>3?K.call(arguments,2):n),typeof e=="function"&&e.defaultProps!=null)for(i in e.defaultProps)l[i]===void 0&&(l[i]=e.defaultProps[i]);return V(e,l,r,o,null)}function V(e,t,n,r,o){var i={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++pe,__i:-1,__u:0};return o==null&&d.vnode!=null&&d.vnode(i),i}function j(e){return e.children}function E(e,t){this.props=e,this.context=t}function A(e,t){if(t==null)return e.__?A(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type=="function"?A(e):null}function ve(e){var t,n;if((e=e.__)!=null&&e.__c!=null){for(e.__e=e.__c.base=null,t=0;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null){e.__e=e.__c.base=n.__e;break}return ve(e)}}function be(e){(!e.__d&&(e.__d=!0)&&T.push(e)&&!q.__r++||fe!=d.debounceRendering)&&((fe=d.debounceRendering)||de)(q)}function q(){for(var e,t,n,r,o,i,l,a=1;T.length;)T.length>a&&T.sort(he),e=T.shift(),a=T.length,e.__d&&(n=void 0,r=void 0,o=(r=(t=e).__v).__e,i=[],l=[],t.__P&&((n=P({},r)).__v=r.__v+1,d.vnode&&d.vnode(n),oe(t.__P,n,r,t.__n,t.__P.namespaceURI,32&r.__u?[o]:null,i,o??A(r),!!(32&r.__u),l),n.__v=r.__v,n.__.__k[n.__i]=n,$e(i,n,l),r.__e=r.__=null,n.__e!=o&&ve(n)));q.__r=0}function ge(e,t,n,r,o,i,l,a,u,s,f){var _,p,c,v,k,x,y,m=r&&r.__k||ye,$=t.length;for(u=et(n,t,m,u,$),_=0;_<$;_++)(c=n.__k[_])!=null&&(p=c.__i==-1?O:m[c.__i]||O,c.__i=_,x=oe(e,c,p,o,i,l,a,u,s,f),v=c.__e,c.ref&&p.ref!=c.ref&&(p.ref&&_e(p.ref,null,c),f.push(c.ref,c.__c||v,c)),k==null&&v!=null&&(k=v),(y=!!(4&c.__u))||p.__k===c.__k?u=xe(c,u,e,y):typeof c.type=="function"&&x!==void 0?u=x:v&&(u=v.nextSibling),c.__u&=-7);return n.__e=k,u}function et(e,t,n,r,o){var i,l,a,u,s,f=n.length,_=f,p=0;for(e.__k=new Array(o),i=0;i<o;i++)(l=t[i])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=e.__k[i]=V(null,l,null,null,null):z(l)?l=e.__k[i]=V(j,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=e.__k[i]=V(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):e.__k[i]=l,u=i+p,l.__=e,l.__b=e.__b+1,a=null,(s=l.__i=tt(l,n,u,_))!=-1&&(_--,(a=n[s])&&(a.__u|=2)),a==null||a.__v==null?(s==-1&&(o>f?p--:o<f&&p++),typeof l.type!="function"&&(l.__u|=4)):s!=u&&(s==u-1?p--:s==u+1?p++:(s>u?p--:p++,l.__u|=4))):e.__k[i]=null;if(_)for(i=0;i<f;i++)(a=n[i])!=null&&!(2&a.__u)&&(a.__e==r&&(r=A(a)),Ce(a,a));return r}function xe(e,t,n,r){var o,i;if(typeof e.type=="function"){for(o=e.__k,i=0;o&&i<o.length;i++)o[i]&&(o[i].__=e,t=xe(o[i],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=A(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Y(e,t){return t=t||[],e==null||typeof e=="boolean"||(z(e)?e.some(function(n){Y(n,t)}):t.push(e)),t}function tt(e,t,n,r){var o,i,l,a=e.key,u=e.type,s=t[n],f=s!=null&&(2&s.__u)==0;if(s===null&&a==null||f&&a==s.key&&u==s.type)return n;if(r>(f?1:0)){for(o=n-1,i=n+1;o>=0||i<t.length;)if((s=t[l=o>=0?o--:i++])!=null&&!(2&s.__u)&&a==s.key&&u==s.type)return l}return-1}function ke(e,t,n){t[0]=="-"?e.setProperty(t,n??""):e[t]=n==null?"":typeof n!="number"||Qe.test(t)?n:n+"px"}function J(e,t,n,r,o){var i,l;e:if(t=="style")if(typeof n=="string")e.style.cssText=n;else{if(typeof r=="string"&&(e.style.cssText=r=""),r)for(t in r)n&&t in n||ke(e.style,t,"");if(n)for(t in n)r&&n[t]==r[t]||ke(e.style,t,n[t])}else if(t[0]=="o"&&t[1]=="n")i=t!=(t=t.replace(me,"$1")),l=t.toLowerCase(),t=l in e||t=="onFocusOut"||t=="onFocusIn"?l.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+i]=n,n?r?n.u=r.u:(n.u=ee,e.addEventListener(t,i?ne:te,i)):e.removeEventListener(t,i?ne:te,i);else{if(o=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&n==1?"":n))}}function we(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t.t==null)t.t=ee++;else if(t.t<n.u)return;return n(d.event?d.event(t):t)}}}function oe(e,t,n,r,o,i,l,a,u,s){var f,_,p,c,v,k,x,y,m,$,I,w,H,S,Q,F,ce,C=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(u=!!(32&n.__u),i=[a=t.__e=n.__e]),(f=d.__b)&&f(t);e:if(typeof C=="function")try{if(y=t.props,m="prototype"in C&&C.prototype.render,$=(f=C.contextType)&&r[f.__c],I=f?$?$.props.value:f.__:r,n.__c?x=(_=t.__c=n.__c).__=_.__E:(m?t.__c=_=new C(y,I):(t.__c=_=new E(y,I),_.constructor=C,_.render=rt),$&&$.sub(_),_.state||(_.state={}),_.__n=r,p=_.__d=!0,_.__h=[],_._sb=[]),m&&_.__s==null&&(_.__s=_.state),m&&C.getDerivedStateFromProps!=null&&(_.__s==_.state&&(_.__s=P({},_.__s)),P(_.__s,C.getDerivedStateFromProps(y,_.__s))),c=_.props,v=_.state,_.__v=t,p)m&&C.getDerivedStateFromProps==null&&_.componentWillMount!=null&&_.componentWillMount(),m&&_.componentDidMount!=null&&_.__h.push(_.componentDidMount);else{if(m&&C.getDerivedStateFromProps==null&&y!==c&&_.componentWillReceiveProps!=null&&_.componentWillReceiveProps(y,I),t.__v==n.__v||!_.__e&&_.shouldComponentUpdate!=null&&_.shouldComponentUpdate(y,_.__s,I)===!1){for(t.__v!=n.__v&&(_.props=y,_.state=_.__s,_.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(L){L&&(L.__=t)}),w=0;w<_._sb.length;w++)_.__h.push(_._sb[w]);_._sb=[],_.__h.length&&l.push(_);break e}_.componentWillUpdate!=null&&_.componentWillUpdate(y,_.__s,I),m&&_.componentDidUpdate!=null&&_.__h.push(function(){_.componentDidUpdate(c,v,k)})}if(_.context=I,_.props=y,_.__P=e,_.__e=!1,H=d.__r,S=0,m){for(_.state=_.__s,_.__d=!1,H&&H(t),f=_.render(_.props,_.state,_.context),Q=0;Q<_._sb.length;Q++)_.__h.push(_._sb[Q]);_._sb=[]}else do _.__d=!1,H&&H(t),f=_.render(_.props,_.state,_.context),_.state=_.__s;while(_.__d&&++S<25);_.state=_.__s,_.getChildContext!=null&&(r=P(P({},r),_.getChildContext())),m&&!p&&_.getSnapshotBeforeUpdate!=null&&(k=_.getSnapshotBeforeUpdate(c,v)),F=f,f!=null&&f.type===j&&f.key==null&&(F=Se(f.props.children)),a=ge(e,z(F)?F:[F],t,n,r,o,i,l,a,u,s),_.base=t.__e,t.__u&=-161,_.__h.length&&l.push(_),x&&(_.__E=_.__=null)}catch(L){if(t.__v=null,u||i!=null)if(L.then){for(t.__u|=u?160:128;a&&a.nodeType==8&&a.nextSibling;)a=a.nextSibling;i[i.indexOf(a)]=null,t.__e=a}else{for(ce=i.length;ce--;)re(i[ce]);ie(t)}else t.__e=n.__e,t.__k=n.__k,L.then||ie(t);d.__e(L,t,n)}else i==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):a=t.__e=nt(n.__e,t,n,r,o,i,l,u,s);return(f=d.diffed)&&f(t),128&t.__u?void 0:a}function ie(e){e&&e.__c&&(e.__c.__e=!0),e&&e.__k&&e.__k.forEach(ie)}function $e(e,t,n){for(var r=0;r<n.length;r++)_e(n[r],n[++r],n[++r]);d.__c&&d.__c(t,e),e.some(function(o){try{e=o.__h,o.__h=[],e.some(function(i){i.call(o)})}catch(i){d.__e(i,o.__v)}})}function Se(e){return typeof e!="object"||e==null||e.__b&&e.__b>0?e:z(e)?e.map(Se):P({},e)}function nt(e,t,n,r,o,i,l,a,u){var s,f,_,p,c,v,k,x=n.props||O,y=t.props,m=t.type;if(m=="svg"?o="http://www.w3.org/2000/svg":m=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),i!=null){for(s=0;s<i.length;s++)if((c=i[s])&&"setAttribute"in c==!!m&&(m?c.localName==m:c.nodeType==3)){e=c,i[s]=null;break}}if(e==null){if(m==null)return document.createTextNode(y);e=document.createElementNS(o,m,y.is&&y),a&&(d.__m&&d.__m(t,i),a=!1),i=null}if(m==null)x===y||a&&e.data==y||(e.data=y);else{if(i=i&&K.call(e.childNodes),!a&&i!=null)for(x={},s=0;s<e.attributes.length;s++)x[(c=e.attributes[s]).name]=c.value;for(s in x)if(c=x[s],s!="children"){if(s=="dangerouslySetInnerHTML")_=c;else if(!(s in y)){if(s=="value"&&"defaultValue"in y||s=="checked"&&"defaultChecked"in y)continue;J(e,s,null,c,o)}}for(s in y)c=y[s],s=="children"?p=c:s=="dangerouslySetInnerHTML"?f=c:s=="value"?v=c:s=="checked"?k=c:a&&typeof c!="function"||x[s]===c||J(e,s,c,x[s],o);if(f)a||_&&(f.__html==_.__html||f.__html==e.innerHTML)||(e.innerHTML=f.__html),t.__k=[];else if(_&&(e.innerHTML=""),ge(t.type=="template"?e.content:e,z(p)?p:[p],t,n,r,m=="foreignObject"?"http://www.w3.org/1999/xhtml":o,i,l,i?i[0]:n.__k&&A(n,0),a,u),i!=null)for(s=i.length;s--;)re(i[s]);a||(s="value",m=="progress"&&v==null?e.removeAttribute("value"):v!=null&&(v!==e[s]||m=="progress"&&!v||m=="option"&&v!=x[s])&&J(e,s,v,x[s],o),s="checked",k!=null&&k!=e[s]&&J(e,s,k,x[s],o))}return e}function _e(e,t,n){try{if(typeof e=="function"){var r=typeof e.__u=="function";r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(o){d.__e(o,n)}}function Ce(e,t,n){var r,o;if(d.unmount&&d.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||_e(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(i){d.__e(i,t)}r.base=r.__P=null}if(r=e.__k)for(o=0;o<r.length;o++)r[o]&&Ce(r[o],t,n||typeof e.type!="function");n||re(e.__e),e.__c=e.__=e.__e=void 0}function rt(e,t,n){return this.constructor(e,n)}function ot(e,t,n){var r,o,i,l;t==document&&(t=document.documentElement),d.__&&d.__(e,t),o=(r=!1)?null:t.__k,i=[],l=[],oe(t,e=t.__k=M(j,null,[e]),o||O,O,t.namespaceURI,o?null:t.firstChild?K.call(t.childNodes):null,i,o?o.__e:t.firstChild,r,l),$e(i,e,l)}K=ye.slice,d={__e:function(e,t,n,r){for(var o,i,l;t=t.__;)if((o=t.__c)&&!o.__)try{if((i=o.constructor)&&i.getDerivedStateFromError!=null&&(o.setState(i.getDerivedStateFromError(e)),l=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(e,r||{}),l=o.__d),l)return o.__E=o}catch(a){e=a}throw e}},pe=0,E.prototype.setState=function(e,t){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=P({},this.state),typeof e=="function"&&(e=e(P({},n),this.props)),e&&P(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),be(this))},E.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),be(this))},E.prototype.render=j,T=[],de=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,he=function(e,t){return e.__v.__b-t.__v.__b},q.__r=0,me=/(PointerCapture)$|Capture$/i,ee=0,te=we(!1),ne=we(!0);var R,b,le,Pe,B=0,Ee=[],g=d,Ie=g.__b,He=g.__r,Te=g.diffed,Me=g.__c,Ne=g.unmount,Ue=g.__;function se(e,t){g.__h&&g.__h(b,e,B||t),B=0;var n=b.__H||(b.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function D(e){return B=1,it(Oe,e)}function it(e,t,n){var r=se(R++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):Oe(void 0,t),function(a){var u=r.__N?r.__N[0]:r.__[0],s=r.t(u,a);u!==s&&(r.__N=[s,r.__[1]],r.__c.setState({}))}],r.__c=b,!b.__f)){var o=function(a,u,s){if(!r.__c.__H)return!0;var f=r.__c.__H.__.filter(function(p){return!!p.__c});if(f.every(function(p){return!p.__N}))return!i||i.call(this,a,u,s);var _=r.__c.props!==a;return f.forEach(function(p){if(p.__N){var c=p.__[0];p.__=p.__N,p.__N=void 0,c!==p.__[0]&&(_=!0)}}),i&&i.call(this,a,u,s)||_};b.__f=!0;var i=b.shouldComponentUpdate,l=b.componentWillUpdate;b.componentWillUpdate=function(a,u,s){if(this.__e){var f=i;i=void 0,o(a,u,s),i=f}l&&l.call(this,a,u,s)},b.shouldComponentUpdate=o}return r.__N||r.__}function je(e,t){var n=se(R++,3);!g.__s&&Le(n.__H,t)&&(n.__=e,n.u=t,b.__H.__h.push(n))}function W(e){return B=5,Ae(function(){return{current:e}},[])}function Ae(e,t){var n=se(R++,7);return Le(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function G(e,t){return B=8,Ae(function(){return e},t)}function _t(){for(var e;e=Ee.shift();)if(e.__P&&e.__H)try{e.__H.__h.forEach(X),e.__H.__h.forEach(ae),e.__H.__h=[]}catch(t){e.__H.__h=[],g.__e(t,e.__v)}}g.__b=function(e){b=null,Ie&&Ie(e)},g.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ue&&Ue(e,t)},g.__r=function(e){He&&He(e),R=0;var t=(b=e.__c).__H;t&&(le===b?(t.__h=[],b.__h=[],t.__.forEach(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(t.__h.forEach(X),t.__h.forEach(ae),t.__h=[],R=0)),le=b},g.diffed=function(e){Te&&Te(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Ee.push(t)!==1&&Pe===g.requestAnimationFrame||((Pe=g.requestAnimationFrame)||lt)(_t)),t.__H.__.forEach(function(n){n.u&&(n.__H=n.u),n.u=void 0})),le=b=null},g.__c=function(e,t){t.some(function(n){try{n.__h.forEach(X),n.__h=n.__h.filter(function(r){return!r.__||ae(r)})}catch(r){t.some(function(o){o.__h&&(o.__h=[])}),t=[],g.__e(r,n.__v)}}),Me&&Me(e,t)},g.unmount=function(e){Ne&&Ne(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.forEach(function(r){try{X(r)}catch(o){t=o}}),n.__H=void 0,t&&g.__e(t,n.__v))};var De=typeof requestAnimationFrame=="function";function lt(e){var t,n=function(){clearTimeout(r),De&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);De&&(t=requestAnimationFrame(n))}function X(e){var t=b,n=e.__c;typeof n=="function"&&(e.__c=void 0,n()),b=t}function ae(e){var t=b;e.__c=e.__(),b=t}function Le(e,t){return!e||e.length!==t.length||t.some(function(n,r){return n!==e[r]})}function Oe(e,t){return typeof t=="function"?t(e):t}const st=`
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #111;
    box-sizing: border-box;
  }

  *, *::before, *::after { box-sizing: inherit; }

  /* Bubble */
  .imply-bubble {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    transition: opacity 0.15s;
    z-index: 999999;
  }
  .imply-bubble:hover { opacity: 0.85; }
  .imply-bubble.left { right: auto; left: 24px; }

  @keyframes imply-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(17,17,17,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(17,17,17,0); }
    100% { box-shadow: 0 0 0 0 rgba(17,17,17,0); }
  }
  .imply-bubble.pulse { animation: imply-pulse 1.5s ease-out 1; }

  /* Drawer */
  .imply-drawer {
    position: fixed;
    bottom: 92px;
    right: 24px;
    width: 380px;
    height: 560px;
    background: #faf8f5;
    border: 1px solid #e5e1db;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    display: flex;
    flex-direction: column;
    z-index: 999998;
    transform: translateY(20px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
  }
  .imply-drawer.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  .imply-drawer.left { right: auto; left: 24px; }

  @media (max-width: 640px) {
    .imply-drawer {
      width: 100vw;
      height: 65vh;
      bottom: 0;
      right: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    .imply-drawer.left { left: 0; }
    .imply-bubble { bottom: 16px; right: 16px; }
    .imply-bubble.left { right: auto; left: 16px; }
  }

  /* Drawer header */
  .imply-header {
    background: #111;
    color: #fff;
    padding: 14px 16px;
    border-radius: 14px 14px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .imply-header-title { font-weight: 600; font-size: 14px; }
  .imply-header-actions { display: flex; gap: 4px; }
  .imply-header-btn {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }
  .imply-header-btn:hover { color: #fff; }

  /* Message list */
  .imply-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .imply-messages::-webkit-scrollbar { width: 4px; }
  .imply-messages::-webkit-scrollbar-thumb { background: #e5e1db; border-radius: 2px; }

  /* Message bubbles */
  .imply-msg { display: flex; flex-direction: column; max-width: 80%; }
  .imply-msg.user { align-self: flex-end; align-items: flex-end; }
  .imply-msg.assistant { align-self: flex-start; align-items: flex-start; }

  .imply-msg-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }
  .imply-msg.user .imply-msg-bubble {
    background: #111;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .imply-msg.assistant .imply-msg-bubble {
    background: #f0ebe4;
    color: #111;
    border-bottom-left-radius: 4px;
  }

  /* Typing dots */
  .imply-typing { display: flex; gap: 4px; padding: 14px; }
  .imply-typing span {
    width: 6px; height: 6px;
    background: #999;
    border-radius: 50%;
    animation: imply-bounce 1.2s infinite;
  }
  .imply-typing span:nth-child(2) { animation-delay: 0.2s; }
  .imply-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes imply-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }

  /* Sources */
  .imply-sources {
    margin-top: 6px;
    font-size: 12px;
    color: #888;
    cursor: pointer;
    user-select: none;
  }
  .imply-sources-list {
    margin-top: 4px;
    padding: 8px 10px;
    background: #fff;
    border: 1px solid #e5e1db;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .imply-source-item { font-size: 11px; color: #555; }

  /* Input bar */
  .imply-input-bar {
    padding: 12px;
    border-top: 1px solid #e5e1db;
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .imply-textarea {
    flex: 1;
    border: 1px solid #e5e1db;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    background: #fff;
    color: #111;
    min-height: 38px;
    max-height: 96px;
    overflow-y: auto;
    line-height: 1.5;
    transition: border-color 0.15s;
  }
  .imply-textarea:focus { border-color: #111; }
  .imply-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
  .imply-send-btn {
    width: 36px;
    height: 36px;
    background: #111;
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .imply-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .imply-send-btn:not(:disabled):hover { opacity: 0.8; }

  /* Error */
  .imply-error {
    font-size: 12px;
    color: #dc2626;
    padding: 4px 14px 8px;
    text-align: center;
  }
`;var at=0;function h(e,t,n,r,o,i){t||(t={});var l,a,u=t;if("ref"in u)for(a in u={},t)a=="ref"?l=t[a]:u[a]=t[a];var s={type:e,props:u,key:n,ref:l,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--at,__i:-1,__u:0,__source:o,__self:i};if(typeof e=="function"&&(l=e.defaultProps))for(a in l)u[a]===void 0&&(u[a]=l[a]);return d.vnode&&d.vnode(s),s}function ut(e,t){for(var n in t)e[n]=t[n];return e}function ze(e,t){for(var n in e)if(n!=="__source"&&!(n in t))return!0;for(var r in t)if(r!=="__source"&&e[r]!==t[r])return!0;return!1}function Re(e,t){this.props=e,this.context=t}(Re.prototype=new E).isPureReactComponent=!0,Re.prototype.shouldComponentUpdate=function(e,t){return ze(this.props,e)||ze(this.state,t)};var Be=d.__b;d.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Be&&Be(e)};var ct=d.__e;d.__e=function(e,t,n,r){if(e.then){for(var o,i=t;i=i.__;)if((o=i.__c)&&o.__c)return t.__e==null&&(t.__e=n.__e,t.__k=n.__k),o.__c(e,t)}ct(e,t,n,r)};var We=d.unmount;function Fe(e,t,n){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(r){typeof r.__c=="function"&&r.__c()}),e.__c.__H=null),(e=ut({},e)).__c!=null&&(e.__c.__P===n&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(r){return Fe(r,t,n)})),e}function Ke(e,t,n){return e&&n&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(r){return Ke(r,t,n)}),e.__c&&e.__c.__P===t&&(e.__e&&n.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=n)),e}function ue(){this.__u=0,this.o=null,this.__b=null}function Ve(e){if(!e.__)return null;var t=e.__.__c;return t&&t.__a&&t.__a(e)}function Z(){this.i=null,this.l=null}d.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),We&&We(e)},(ue.prototype=new E).__c=function(e,t){var n=t.__c,r=this;r.o==null&&(r.o=[]),r.o.push(n);var o=Ve(r.__v),i=!1,l=function(){i||r.__z||(i=!0,n.__R=null,o?o(u):u())};n.__R=l;var a=n.__P;n.__P=null;var u=function(){if(!--r.__u){if(r.state.__a){var s=r.state.__a;r.__v.__k[0]=Ke(s,s.__c.__P,s.__c.__O)}var f;for(r.setState({__a:r.__b=null});f=r.o.pop();)f.__P=a,f.forceUpdate()}};r.__u++||32&t.__u||r.setState({__a:r.__b=r.__v.__k[0]}),e.then(l,l)},ue.prototype.componentWillUnmount=function(){this.o=[]},ue.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var n=document.createElement("div"),r=this.__v.__k[0].__c;this.__v.__k[0]=Fe(this.__b,n,r.__O=r.__P)}this.__b=null}var o=t.__a&&M(j,null,e.fallback);return o&&(o.__u&=-33),[M(j,null,t.__a?null:e.children),o]};var qe=function(e,t,n){if(++n[1]===n[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!=="t"||!e.l.size))for(n=e.i;n;){for(;n.length>3;)n.pop()();if(n[1]<n[0])break;e.i=n=n[2]}};(Z.prototype=new E).__a=function(e){var t=this,n=Ve(t.__v),r=t.l.get(e);return r[0]++,function(o){var i=function(){t.props.revealOrder?(r.push(o),qe(t,e,r)):o()};n?n(i):i()}},Z.prototype.render=function(e){this.i=null,this.l=new Map;var t=Y(e.children);e.revealOrder&&e.revealOrder[0]==="b"&&t.reverse();for(var n=t.length;n--;)this.l.set(t[n],this.i=[1,0,this.i]);return e.children},Z.prototype.componentDidUpdate=Z.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,n){qe(e,n,t)})};var pt=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,ft=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,dt=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,ht=/[A-Z0-9]/g,mt=typeof document<"u",yt=function(e){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(e)};E.prototype.isReactComponent={},["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(E.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Ye=d.event;function vt(){}function bt(){return this.cancelBubble}function gt(){return this.defaultPrevented}d.event=function(e){return Ye&&(e=Ye(e)),e.persist=vt,e.isPropagationStopped=bt,e.isDefaultPrevented=gt,e.nativeEvent=e};var xt={enumerable:!1,configurable:!0,get:function(){return this.class}},Je=d.vnode;d.vnode=function(e){typeof e.type=="string"&&function(t){var n=t.props,r=t.type,o={},i=r.indexOf("-")===-1;for(var l in n){var a=n[l];if(!(l==="value"&&"defaultValue"in n&&a==null||mt&&l==="children"&&r==="noscript"||l==="class"||l==="className")){var u=l.toLowerCase();l==="defaultValue"&&"value"in n&&n.value==null?l="value":l==="download"&&a===!0?a="":u==="translate"&&a==="no"?a=!1:u[0]==="o"&&u[1]==="n"?u==="ondoubleclick"?l="ondblclick":u!=="onchange"||r!=="input"&&r!=="textarea"||yt(n.type)?u==="onfocus"?l="onfocusin":u==="onblur"?l="onfocusout":dt.test(l)&&(l=u):u=l="oninput":i&&ft.test(l)?l=l.replace(ht,"-$&").toLowerCase():a===null&&(a=void 0),u==="oninput"&&o[l=u]&&(l="oninputCapture"),o[l]=a}}r=="select"&&o.multiple&&Array.isArray(o.value)&&(o.value=Y(n.children).forEach(function(s){s.props.selected=o.value.indexOf(s.props.value)!=-1})),r=="select"&&o.defaultValue!=null&&(o.value=Y(n.children).forEach(function(s){s.props.selected=o.multiple?o.defaultValue.indexOf(s.props.value)!=-1:o.defaultValue==s.props.value})),n.class&&!n.className?(o.class=n.class,Object.defineProperty(o,"className",xt)):(n.className&&!n.class||n.class&&n.className)&&(o.class=o.className=n.className),t.props=o}(e),e.$$typeof=pt,Je&&Je(e)};var Ge=d.__r;d.__r=function(e){Ge&&Ge(e),e.__c};var Xe=d.diffed;d.diffed=function(e){Xe&&Xe(e);var t=e.props,n=e.__e;n!=null&&e.type==="textarea"&&"value"in t&&t.value!==n.value&&(n.value=t.value==null?"":t.value)};function kt({isOpen:e,position:t,onToggle:n}){const r=W(null),o=W(!1);je(()=>{!o.current&&r.current&&(r.current.classList.add("pulse"),o.current=!0)},[]);const i=["imply-bubble",t==="bottom-left"?"left":""].filter(Boolean).join(" ");return h("button",{ref:r,class:i,"aria-label":e?"Close chat":"Open chat",onClick:n,children:e?h("svg",{width:"20",height:"20",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:h("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M6 18L18 6M6 6l12 12"})}):h("svg",{width:"20",height:"20",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"1.5",children:h("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"})})})}function wt({message:e}){const[t,n]=D(!1);return e.isTyping?h("div",{class:"imply-msg assistant",children:h("div",{class:"imply-msg-bubble",children:h("div",{class:"imply-typing",children:[h("span",{}),h("span",{}),h("span",{})]})})}):h("div",{class:`imply-msg ${e.role}`,children:[h("div",{class:"imply-msg-bubble",children:e.content}),e.role==="assistant"&&e.sources&&e.sources.length>0&&h("div",{class:"imply-sources",onClick:()=>n(r=>!r),children:[t?"▾":"▸"," ",e.sources.length," source",e.sources.length!==1?"s":"",t&&h("div",{class:"imply-sources-list",children:e.sources.map((r,o)=>h("div",{class:"imply-source-item",children:r.filename},o))})]})]})}function $t({messages:e,error:t}){const n=W(null);return je(()=>{var r;(r=n.current)==null||r.scrollIntoView({behavior:"smooth"})},[e]),h("div",{class:"imply-messages",children:[e.length===0&&h("p",{style:{color:"#999",fontSize:"13px",textAlign:"center",marginTop:"32px"},children:"Ask me anything about this product."}),e.map(r=>h(wt,{message:r},r.id)),t!==null&&h("div",{class:"imply-error",children:t}),h("div",{ref:n})]})}function St({isStreaming:e,onSend:t}){const[n,r]=D(""),o=W(null);function i(u){u.key==="Enter"&&!u.shiftKey&&(u.preventDefault(),l())}function l(){const u=n.trim();!u||e||(t(u),r(""),o.current&&(o.current.style.height="auto"))}function a(u){const s=u.currentTarget;r(s.value),s.style.height="auto",s.style.height=`${Math.min(s.scrollHeight,96)}px`}return h("div",{class:"imply-input-bar",children:[h("textarea",{ref:o,class:"imply-textarea",placeholder:"Type a message...",value:n,disabled:e,rows:1,onInput:a,onKeyDown:i}),h("button",{class:"imply-send-btn",disabled:e||!n.trim(),onClick:l,"aria-label":"Send",children:h("svg",{width:"16",height:"16",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:h("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5"})})})]})}function Ct({isOpen:e,title:t,position:n,messages:r,isStreaming:o,error:i,onClose:l,onSend:a}){const u=["imply-drawer",e?"open":"",n==="bottom-left"?"left":""].filter(Boolean).join(" ");return h("div",{class:u,"aria-hidden":!e,children:[h("div",{class:"imply-header",children:[h("span",{class:"imply-header-title",children:t}),h("div",{class:"imply-header-actions",children:h("button",{class:"imply-header-btn",onClick:l,"aria-label":"Close chat",children:h("svg",{width:"16",height:"16",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:h("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M6 18L18 6M6 6l12 12"})})})})]}),h($t,{messages:r,error:i}),h(St,{isStreaming:o,onSend:a})]})}function Pt(e){if(!e.startsWith("data: "))return null;try{return JSON.parse(e.slice(6))}catch{return null}}function Ze(){return Math.random().toString(36).slice(2,10)}function Et(e){const[t,n]=D([]),[r,o]=D(!1),[i,l]=D(null),a=W(sessionStorage.getItem(`imply-conv-${e.projectId}`)),u=G(async s=>{if(r||!s.trim())return;l(null),o(!0);const f={id:Ze(),role:"user",content:s.trim()};n(p=>[...p,f]);const _=Ze();n(p=>[...p,{id:_,role:"assistant",content:"",isTyping:!0}]);try{const p=await fetch(`${e.baseUrl}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json","X-Imply-Project-Key":e.apiKey},body:JSON.stringify({projectId:e.projectId,message:s.trim(),conversationId:a.current??void 0})});if(!p.ok||!p.body)throw new Error(`Request failed (${p.status})`);const c=p.body.getReader(),v=new TextDecoder;let k="",x=[];for(;;){const{done:y,value:m}=await c.read();if(y)break;k+=v.decode(m,{stream:!0});const $=k.split(`
`);k=$.pop()??"";for(const I of $){const w=Pt(I.trim());if(w){if(w.type==="sources")x=w.data;else if(w.type==="delta")n(H=>H.map(S=>S.id===_?{...S,content:S.content+w.text,isTyping:!1}:S));else if(w.type==="done")a.current=w.conversationId,sessionStorage.setItem(`imply-conv-${e.projectId}`,w.conversationId),n(H=>H.map(S=>S.id===_?{...S,sources:x,isTyping:!1}:S));else if(w.type==="action")It(w.action,e.onNavigate);else if(w.type==="error")throw new Error(w.message)}}}}catch(p){const c=p instanceof Error?p.message:"Something went wrong. Try again.";l(c),n(v=>v.filter(k=>k.id!==_))}finally{o(!1)}},[r,e]);return{messages:t,isStreaming:r,error:i,sendMessage:u}}function It(e,t){e.kind==="navigate"?t?t(e.url):window.location.href=e.url:e.kind==="open_tab"&&window.open(e.url,"_blank","noopener,noreferrer")}let N=null;function Ht({config:e}){const[t,n]=D(!1),{messages:r,isStreaming:o,error:i,sendMessage:l}=Et({apiKey:e.apiKey,projectId:e.projectId,baseUrl:"",onNavigate:e.onNavigate}),a=G(()=>n(!0),[]),u=G(()=>n(!1),[]),s=G(()=>n(f=>!f),[]);return window.Imply={open:a,close:u,destroy:()=>{N==null||N.remove()}},M("div",{style:"display:contents"},M(kt,{isOpen:t,position:e.position??"bottom-right",onToggle:s}),M(Ct,{isOpen:t,title:e.title??"Imply",position:e.position??"bottom-right",messages:r,isStreaming:o,error:i,onClose:u,onSend:l}))}const U=window.ImplyConfig;if(!(U!=null&&U.apiKey)||!(U!=null&&U.projectId))console.warn("[Imply] missing apiKey or projectId in window.ImplyConfig");else{N=document.createElement("div"),N.id="imply-root",document.body.appendChild(N);const e=N.attachShadow({mode:"open"}),t=document.createElement("style");t.textContent=st,e.appendChild(t);const n=document.createElement("div");e.appendChild(n),ot(M(Ht,{config:U}),n)}})();
