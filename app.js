'use strict';
const $ = id => document.getElementById(id);
const categories = {expense:['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Compras','Contas','Outros'],income:['Salário','Renda extra','Vendas','Reembolso','Outros']};
const money = n => Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today = () => new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
let active = sessionStorage.getItem('financeUser')||'', entries=[];
const users = () => JSON.parse(localStorage.getItem('financeUsers')||'{}');
function load(){try{entries=JSON.parse(localStorage.getItem('financeEntries:'+active)||'[]')}catch{entries=[]}}
function save(){localStorage.setItem('financeEntries:'+active,JSON.stringify(entries));render()}
function show(){ $('auth').classList.toggle('oculto',!!active);$('app').classList.toggle('oculto',!active);if(active){$('hello').textContent='Olá, '+(users()[active]?.name||active);load();$('monthFilter').value=today().slice(0,7);render()}}
function setCategories(){const list=categories[$('type').value],old=$('category').value;$('category').replaceChildren(...list.map(x=>new Option(x,x)));if(list.includes(old))$('category').value=old}
function render(){
 const month=$('monthFilter').value,cat=$('categoryFilter').value,q=$('search').value.trim().toLocaleLowerCase('pt-BR');
 const monthly=entries.filter(e=>!month||e.date.startsWith(month));
 const cats=[...new Set(monthly.map(e=>e.category))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 $('categoryFilter').replaceChildren(new Option('Todas',''),...cats.map(x=>new Option(x,x)));$('categoryFilter').value=cats.includes(cat)?cat:'';
 const found=monthly.filter(e=>(!cat||e.category===cat)&&(!q||(e.desc+' '+e.category+' '+(e.note||'')).toLocaleLowerCase('pt-BR').includes(q)));
 const income=found.filter(e=>e.type==='income').reduce((n,e)=>n+Number(e.value),0),expense=found.filter(e=>e.type==='expense').reduce((n,e)=>n+Number(e.value),0);
 $('income').textContent=money(income);$('expense').textContent=money(expense);$('balance').textContent=money(income-expense);$('count').textContent=found.length;
 $('empty').classList.toggle('oculto',found.length>0);
 $('rows').replaceChildren(...found.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{
  const tr=document.createElement('tr');for(const value of [e.date.split('-').reverse().join('/'),e.desc,e.category,e.type==='income'?'Receita':'Despesa',money(e.value)]){const td=document.createElement('td');td.textContent=value;tr.append(td)}tr.children[4].className='valor-'+e.type;
  const actions=document.createElement('td');actions.className='actions';
  const edit=document.createElement('button');edit.type='button';edit.textContent='✎';edit.title='Editar';edit.setAttribute('aria-label','Editar '+e.desc);edit.onclick=()=>openEntry(e);
  const del=document.createElement('button');del.type='button';del.textContent='✕';del.title='Excluir';del.setAttribute('aria-label','Excluir '+e.desc);del.onclick=()=>{if(confirm('Excluir o lançamento '+e.desc+'?')){entries=entries.filter(x=>x.id!==e.id);save()}};
  actions.append(edit,del);tr.append(actions);return tr
 }));
 const totals={};found.filter(e=>e.type==='expense').forEach(e=>totals[e.category]=(totals[e.category]||0)+Number(e.value));
 $('categorySummary').replaceChildren(...Object.entries(totals).sort((a,b)=>b[1]-a[1]).map(([name,total])=>{const row=document.createElement('div');row.className='cat-row';const label=document.createElement('span');label.textContent=name;const number=document.createElement('strong');number.textContent=money(total);const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('i');fill.style.width=(expense?total/expense*100:0)+'%';bar.append(fill);row.append(label,number,bar);return row}));
}
function openEntry(e){$('entryForm').reset();$('entryId').value=e?.id||'';$('modalTitle').textContent=e?'Editar lançamento':'Novo lançamento';$('type').value=e?.type||'expense';setCategories();$('desc').value=e?.desc||'';$('value').value=e?.value||'';$('date').value=e?.date||today();$('category').value=e?.category||categories[$('type').value][0];$('payment').value=e?.payment||'Pix';$('note').value=e?.note||'';$('entryModal').showModal()}
$('showRegister').onclick=()=>{$('loginForm').classList.add('oculto');$('registerForm').classList.remove('oculto')};
$('backLogin').onclick=()=>{$('registerForm').classList.add('oculto');$('loginForm').classList.remove('oculto')};
$('registerForm').onsubmit=e=>{e.preventDefault();const name=$('regName').value.trim(),user=$('regUser').value.trim().toLowerCase(),pass=$('regPass').value;if(pass!==$('regPass2').value){$('regMsg').textContent='As senhas não conferem.';return}if(users()[user]){$('regMsg').textContent='Esse usuário já existe.';return}const all=users();all[user]={name,pass};localStorage.setItem('financeUsers',JSON.stringify(all));active=user;sessionStorage.setItem('financeUser',user);show()};
$('loginForm').onsubmit=e=>{e.preventDefault();const user=$('loginUser').value.trim().toLowerCase();if(users()[user]?.pass!==$('loginPass').value){$('loginMsg').textContent='Usuário ou senha incorretos.';return}active=user;sessionStorage.setItem('financeUser',user);show()};
$('logout').onclick=()=>{sessionStorage.removeItem('financeUser');active='';$('loginPass').value='';show()};
$('newEntry').onclick=()=>openEntry();$('cancel').onclick=()=>$('entryModal').close();$('type').onchange=setCategories;
$('entryForm').onsubmit=e=>{e.preventDefault();const value=Number($('value').value);if(!Number.isFinite(value)||value<=0)return;const id=$('entryId').value;const item={id:id||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),desc:$('desc').value.trim(),value,date:$('date').value,type:$('type').value,category:$('category').value,payment:$('payment').value,note:$('note').value.trim()};if(!item.desc)return;const index=entries.findIndex(e=>e.id===id);if(index<0)entries.push(item);else entries[index]=item;save();$('entryModal').close()};
for(const id of ['monthFilter','categoryFilter','search'])$(id).addEventListener(id==='search'?'input':'change',render);
show();
