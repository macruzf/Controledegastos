const STORAGE_KEY='meuControleFinanceiro_lancamentos_v1';
const SETTINGS_KEY='meuControleFinanceiro_config_v1';
const categories={expense:['Alimentação','Mercado','Moradia','Transporte','Saúde','Educação','Lazer','Compras','Contas','Outros'],income:['Salário','Renda extra','Venda','Reembolso','Investimentos','Outros']};
let entries=load(STORAGE_KEY,[]),settings=load(SETTINGS_KEY,{budgets:{}}),viewDate=new Date(),deleteId=null;
const $=s=>document.querySelector(s), money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}), months=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}
function key(d=viewDate){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function monthEntries(){return entries.filter(e=>e.date.startsWith(key()))}
function setCategories(){const type=document.querySelector('[name=type]:checked').value,current=$('#category').value;$('#category').innerHTML=categories[type].map(c=>`<option>${c}</option>`).join('');if(categories[type].includes(current))$('#category').value=current}
function safe(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t.timer);t.timer=setTimeout(()=>t.classList.remove('show'),2200)}
function render(){
  $('#monthLabel').textContent=months.format(viewDate);const all=monthEntries(),income=all.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0),expense=all.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),budget=Number(settings.budgets[key()]||0);
  $('#balanceValue').textContent=money.format(income-expense);$('#incomeValue').textContent=money.format(income);$('#expenseValue').textContent=money.format(expense);$('#incomeCount').textContent=`${all.filter(e=>e.type==='income').length} lançamento(s)`;$('#expenseCount').textContent=`${all.filter(e=>e.type==='expense').length} lançamento(s)`;
  $('#budgetValue').textContent=budget?money.format(budget):'Não definido';const percent=budget?expense/budget*100:0;$('#budgetBar').style.width=`${Math.min(100,percent)}%`;$('#budgetBar').style.background=percent>100?'var(--red)':'var(--lime)';$('#budgetHint').textContent=budget?`${percent.toFixed(0)}% utilizado`:'Defina nas configurações';
  const grouped={};all.filter(e=>e.type==='expense').forEach(e=>grouped[e.category]=(grouped[e.category]||0)+e.amount);$('#categorySummary').innerHTML=Object.entries(grouped).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<span class="cat-pill">${safe(c)} <strong>${money.format(v)}</strong></span>`).join('');
  const type=$('#typeFilter').value,search=$('#search').value.toLowerCase();const filtered=all.filter(e=>(type==='all'||e.type===type)&&(e.description+' '+e.category+' '+e.note).toLowerCase().includes(search)).sort((a,b)=>b.date.localeCompare(a.date));
  $('#entryList').innerHTML=filtered.map(e=>`<tr><td>${e.date.split('-').reverse().join('/')}</td><td><strong>${safe(e.description)}</strong>${e.note?`<br><small>${safe(e.note)}</small>`:''}</td><td>${safe(e.category)}</td><td>${safe(e.payment)}</td><td class="value ${e.type==='expense'?'amount-expense':'amount-income'}">${e.type==='expense'?'−':'＋'} ${money.format(e.amount)}</td><td><div class="row-actions"><button data-edit="${e.id}" aria-label="Editar ${safe(e.description)}">✎</button><button data-delete="${e.id}" aria-label="Excluir ${safe(e.description)}">⌫</button></div></td></tr>`).join('');
  $('#emptyState').classList.toggle('hidden',filtered.length>0);$('.table-wrap').classList.toggle('hidden',filtered.length===0);
}
function resetForm(){
  $('#entryForm').reset();$('#entryId').value='';document.querySelector('[name=type][value=expense]').checked=true;$('#date').value=new Date().toISOString().slice(0,10);$('#submitBtn').textContent='Adicionar lançamento';$('#cancelEdit').classList.add('hidden');setCategories();
}
function editEntry(id){const e=entries.find(x=>x.id===id);if(!e)return;$('#entryId').value=e.id;document.querySelector(`[name=type][value=${e.type}]`).checked=true;setCategories();$('#description').value=e.description;$('#amount').value=e.amount;$('#date').value=e.date;$('#category').value=e.category;$('#payment').value=e.payment;$('#note').value=e.note;$('#submitBtn').textContent='Salvar alterações';$('#cancelEdit').classList.remove('hidden');$('.entry-card').scrollIntoView({behavior:'smooth'});}
document.querySelectorAll('[name=type]').forEach(r=>r.addEventListener('change',setCategories));
$('#entryForm').addEventListener('submit',ev=>{ev.preventDefault();const item={id:$('#entryId').value||crypto.randomUUID(),type:document.querySelector('[name=type]:checked').value,description:$('#description').value.trim(),amount:Number($('#amount').value),date:$('#date').value,category:$('#category').value,payment:$('#payment').value,note:$('#note').value.trim()};const i=entries.findIndex(e=>e.id===item.id);if(i>=0)entries[i]=item;else entries.push(item);save();viewDate=new Date(item.date+'T12:00:00');resetForm();render();toast(i>=0?'Lançamento atualizado':'Lançamento adicionado')});
$('#cancelEdit').addEventListener('click',resetForm);$('#prevMonth').addEventListener('click',()=>{viewDate.setMonth(viewDate.getMonth()-1);render()});$('#nextMonth').addEventListener('click',()=>{viewDate.setMonth(viewDate.getMonth()+1);render()});$('#typeFilter').addEventListener('change',render);$('#search').addEventListener('input',render);
$('#entryList').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit)editEntry(edit.dataset.edit);if(del){deleteId=del.dataset.delete;$('#deleteDialog').showModal()}});
$('#deleteDialog').addEventListener('close',()=>{if($('#deleteDialog').returnValue==='confirm'&&deleteId){entries=entries.filter(e=>e.id!==deleteId);save();render();toast('Lançamento excluído')}deleteId=null});
$('#configBtn').addEventListener('click',()=>{$('#budgetInput').value=settings.budgets[key()]||'';$('#settingsDialog').showModal()});document.querySelectorAll('#settingsDialog .close').forEach(b=>b.addEventListener('click',()=>$('#settingsDialog').close()));
$('#settingsForm').addEventListener('submit',e=>{e.preventDefault();settings.budgets[key()]=Number($('#budgetInput').value)||0;save();$('#settingsDialog').close();render();toast('Limite mensal salvo')});
window.financeiro={adicionarLancamento(dados){entries.push({id:crypto.randomUUID(),note:'',payment:'Outro',...dados,amount:Number(dados.amount)});save();render()},listarLancamentos(){return monthEntries()}};

function registerWebMCP(){
  const context=document.modelContext;
  if(!context?.registerTool)return;
  const register=tool=>{try{Promise.resolve(context.registerTool(tool)).catch(()=>{})}catch{}}
  register({name:'list_month_transactions',title:'Listar lançamentos do mês',description:'Lista as receitas e despesas exibidas no mês selecionado.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({month:key(),transactions:monthEntries()})});
  register({name:'create_financial_transaction',title:'Adicionar lançamento financeiro',description:'Adiciona uma receita ou despesa ao controle financeiro e atualiza a tela.',inputSchema:{type:'object',properties:{type:{type:'string',enum:['income','expense']},description:{type:'string',minLength:1},amount:{type:'number',exclusiveMinimum:0},date:{type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'},category:{type:'string',minLength:1},payment:{type:'string'}},required:['type','description','amount','date','category'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!categories[input.type]?.includes(input.category))throw new Error('Categoria inválida para o tipo informado.');const item={id:crypto.randomUUID(),note:'',payment:input.payment||'Outro',...input,amount:Number(input.amount)};entries.push(item);save();viewDate=new Date(item.date+'T12:00:00');render();return {created:true,id:item.id,balanceMonth:key()}}});
}
resetForm();render();
registerWebMCP();
