var TODAY = new Date();
var vYear  = TODAY.getFullYear();
var vMonth = TODAY.getMonth();
var selDay = null;
var picked = [];
var editingId = null;
var signups = [];
try { signups = JSON.parse(localStorage.getItem('msnrSU3') || '[]'); } catch(e){ signups=[]; }

var SLOTS = [];
for(var h=7;h<=21;h++){
  var ap = h<12?'AM':'PM';
  var h12 = h===0?12:h>12?h-12:h;
  SLOTS.push(h12+':00 '+ap);
  if(h<21) SLOTS.push(h12+':30 '+ap);
}

function save(){ try{ localStorage.setItem('msnrSU3', JSON.stringify(signups)); }catch(e){} }
function dkey(y,m,d){ return y+'-'+(m+1)+'-'+d; }
function parseDK(s){
  var p=s.split('-').map(Number);
  return new Date(p[0],p[1]-1,p[2]);
}
function fmtDK(s){
  if(!s)return'';
  return parseDK(s).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
}
function initials(name){
  return name.split(' ').map(function(n){return n[0]||'';}).join('').toUpperCase().slice(0,2);
}
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getDaySUs(dk){ return signups.filter(function(s){return s.dates&&s.dates.indexOf(dk)>-1;}); }
function slotIndex(sl){ return SLOTS.indexOf(sl); }
function sortSlots(arr){ return arr.slice().sort(function(a,b){return slotIndex(a)-slotIndex(b);}); }

function buildDates(startDate,freq){
  var dates=[],lim=freq==='monthly'?12:freq==='biweekly'?26:52;
  var cur=new Date(startDate);
  for(var i=0;i<lim;i++){
    dates.push(cur.getFullYear()+'-'+(cur.getMonth()+1)+'-'+cur.getDate());
    if(freq==='weekly') cur.setDate(cur.getDate()+7);
    else if(freq==='biweekly') cur.setDate(cur.getDate()+14);
    else cur.setMonth(cur.getMonth()+1);
  }
  return dates;
}

/* TABS */
function switchTab(tab){
  var panels=document.querySelectorAll('.view-panel');
  var btns=document.querySelectorAll('.tab-btn');
  for(var i=0;i<panels.length;i++) panels[i].classList.remove('active');
  for(var i=0;i<btns.length;i++) btns[i].classList.remove('active');
  if(tab==='calendar'){
    document.getElementById('calendarView').classList.add('active');
    btns[0].classList.add('active');
  } else {
    document.getElementById('adminView').classList.add('active');
    btns[1].classList.add('active');
    populateAdminMonSel();
    renderAdmin();
  }
}

/* CALENDAR */
function renderCalendar(){
  document.getElementById('monthLabel').textContent=
    new Date(vYear,vMonth,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  var grid=document.getElementById('calGrid');
  grid.innerHTML='';
  var firstDow=new Date(vYear,vMonth,1).getDay();
  var daysInMo=new Date(vYear,vMonth+1,0).getDate();
  var todayFlat=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
  for(var i=0;i<firstDow;i++){
    var c=document.createElement('div');c.className='cal-cell empty';
    c.innerHTML='<div class="day-num"></div>';grid.appendChild(c);
  }
  for(var d=1;d<=daysInMo;d++){
    var c=document.createElement('div');
    var dt=new Date(vYear,vMonth,d);
    var isPast=dt<todayFlat;
    var isToday=d===TODAY.getDate()&&vMonth===TODAY.getMonth()&&vYear===TODAY.getFullYear();
    var dk=dkey(vYear,vMonth,d);
    var sus=getDaySUs(dk);
    var cls='cal-cell';
    if(isPast)cls+=' past';
    if(isToday)cls+=' today';
    if(sus.length>0&&!isPast)cls+=' has-su';
    if(selDay===d)cls+=' sel-day';
    c.className=cls;
    c.innerHTML='<div class="day-num">'+d+'</div>'+(sus.length>0?'<div class="day-count">'+sus.length+' sign-up'+(sus.length>1?'s':'')+'</div>':'');
    if(!isPast)(function(dd){c.addEventListener('click',function(){openDay(dd);});})(d);
    grid.appendChild(c);
  }
}

function openDay(d){
  selDay=d; picked=[];
  renderCalendar();
  var dt=new Date(vYear,vMonth,d);
  document.getElementById('panelTitle').textContent=
    dt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  renderSlots();
  document.getElementById('signupForm').classList.remove('open');
  document.getElementById('timePanel').classList.add('open');
  document.getElementById('timePanel').scrollIntoView({behavior:'smooth',block:'nearest'});
}

document.getElementById('closePanel').addEventListener('click',function(){
  document.getElementById('timePanel').classList.remove('open');
  selDay=null; picked=[]; renderCalendar();
});
document.getElementById('prevMonth').addEventListener('click',function(){
  vMonth--;if(vMonth<0){vMonth=11;vYear--;}
  closeTimePnl(); renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click',function(){
  vMonth++;if(vMonth>11){vMonth=0;vYear++;}
  closeTimePnl(); renderCalendar();
});
function closeTimePnl(){
  document.getElementById('timePanel').classList.remove('open');
  selDay=null; picked=[];
}

/* SLOTS */
function renderSlots(){
  var dk=dkey(vYear,vMonth,selDay);
  var grid=document.getElementById('slotsGrid');
  grid.innerHTML='';
  for(var i=0;i<SLOTS.length;i++){
    (function(sl){
      var btn=document.createElement('button');
      var isPicked=picked.indexOf(sl)>-1;
      btn.className='slot-btn'+(isPicked?' picked':'');
      var cnt=signups.filter(function(s){return s.dates&&s.dates.indexOf(dk)>-1&&s.slots.indexOf(sl)>-1;}).length;
      btn.innerHTML=sl+'<span class="sm">'+(cnt>0?cnt+' signed up':'Open')+'</span>';
      btn.addEventListener('click',function(){
        var idx=picked.indexOf(sl);
        if(idx>-1) picked.splice(idx,1);
        else picked.push(sl);
        btn.classList.toggle('picked',picked.indexOf(sl)>-1);
        updateFormVis(dk);
      });
      grid.appendChild(btn);
    })(SLOTS[i]);
  }
}

function updateFormVis(dk){
  var f=document.getElementById('signupForm');
  if(picked.length>0){
    f.classList.add('open');
    var sorted=sortSlots(picked);
    document.getElementById('selSum').innerHTML='<strong>Selected: </strong>'+sorted.join(' &middot; ');
  } else {
    f.classList.remove('open');
  }
}

/* SUBMIT */
function doSubmit(){
  var name=document.getElementById('fName').value.trim();
  var phone=document.getElementById('fPhone').value.trim();
  if(!name){showToast('Please enter your name.',true);return;}
  if(!phone){showToast('Please enter your phone number.',true);return;}
  if(picked.length===0){showToast('Please select at least one time slot.',true);return;}
  var recur=document.getElementById('recurChk').checked;
  var freq=document.getElementById('recurFreq').value;
  var dk=dkey(vYear,vMonth,selDay);
  var slots=sortSlots(picked);
  var dates=recur?buildDates(new Date(vYear,vMonth,selDay),freq):[dk];
  var entry={id:Date.now(),name:name,phone:phone,slots:slots,dateKey:dk,dates:dates,recur:recur,freq:recur?freq:null,created:new Date().toISOString()};
  signups.push(entry);
  save();
  document.getElementById('fName').value='';
  document.getElementById('fPhone').value='';
  document.getElementById('recurChk').checked=false;
  document.getElementById('recurOpts').classList.remove('open');
  picked=[];
  document.getElementById('signupForm').classList.remove('open');
  renderCalendar();
  if(selDay) renderSlots();
  renderList();
  openSmsModal(entry);
}

/* CALENDAR CONFIRM MODAL */
var _pendingIcs = '';

function openSmsModal(entry){
  try {
    var dateStr=parseDK(entry.dateKey).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    var slots=entry.slots||[];
    var slotHtml='';
    for(var i=0;i<slots.length;i++) slotHtml+='<span class="scb-slot">'+esc(slots[i])+'</span>';
    var datesArr=entry.dates||[entry.dateKey];
    var preview='';
    for(var i=0;i<Math.min(3,datesArr.length);i++){
      var p=datesArr[i].split('-').map(Number);
      if(i>0) preview+=', ';
      preview+=new Date(p[0],p[1]-1,p[2]).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    }
    if(datesArr.length>3) preview+=' + '+(datesArr.length-3)+' more';
    var recurHtml=entry.recur?'<div class="scb-recur">&#128257; Repeating '+esc(entry.freq)+' &middot; '+esc(preview)+'</div>':'';
    document.getElementById('smsCommitBox').innerHTML=
      '<div class="scb-name">Signed up: <strong>'+esc(entry.name)+'</strong></div>'+
      '<div class="scb-date">'+esc(dateStr)+'</div>'+
      '<div class="scb-slots">'+slotHtml+'</div>'+recurHtml;

    // Build Google Calendar URL (works on any device, no download needed)
    var gcalUrl = buildGCalUrl(entry);
    document.getElementById('gcalBtn').href = gcalUrl;

    // Store ICS text for Apple Calendar instructions
    _pendingIcs = buildIcs(entry);
    document.getElementById('icsTextBox').textContent = _pendingIcs;
    document.getElementById('icsInstructions').style.display = 'none';

    document.getElementById('smsModal').classList.add('open');
  } catch(err){
    console.error('Calendar modal error:',err);
    showToast(entry.name+' - you are signed up!');
  }
}

function showIcsInstructions(){
  var el = document.getElementById('icsInstructions');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function buildGCalUrl(entry){
  function pad(n){return String(n).padStart(2,'0');}
  function parseTime(slot){
    var m=slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if(!m) return {h:9,min:0};
    var h=parseInt(m[1]),min=parseInt(m[2]),ap=m[3].toUpperCase();
    if(ap==='PM'&&h!==12) h+=12;
    if(ap==='AM'&&h===12) h=0;
    return {h:h,min:min};
  }
  var p=entry.dateKey.split('-').map(Number);
  var y=p[0],mo=p[1],d=p[2];
  var s0=parseTime(entry.slots[0]);
  var sN=parseTime(entry.slots[entry.slots.length-1]);
  var endMin=sN.min+30,endH=sN.h;
  if(endMin>=60){endH++;endMin-=60;}
  var dtS=y+''+pad(mo)+''+pad(d)+'T'+pad(s0.h)+''+pad(s0.min)+'00';
  var dtE=y+''+pad(mo)+''+pad(d)+'T'+pad(endH)+''+pad(endMin)+'00';
  var details='Times: '+entry.slots.join(', ')+(entry.recur?' | Repeating: '+entry.freq:'');
  var url='https://calendar.google.com/calendar/render?action=TEMPLATE'+
    '&text='+encodeURIComponent('Teach With the Missionaries')+
    '&dates='+dtS+'/'+dtE+
    '&details='+encodeURIComponent(details)+
    '&sf=true&output=xml';
  if(entry.recur){
    var rrule=entry.freq==='weekly'?'RRULE:FREQ=WEEKLY':entry.freq==='biweekly'?'RRULE:FREQ=WEEKLY;INTERVAL=2':'RRULE:FREQ=MONTHLY';
    url+='&recur='+encodeURIComponent(rrule);
  }
  return url;
}

function buildIcs(entry){
  function pad(n){return String(n).padStart(2,'0');}
  function parseTime(slot){
    var m=slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if(!m) return {h:9,min:0};
    var h=parseInt(m[1]),min=parseInt(m[2]),ap=m[3].toUpperCase();
    if(ap==='PM'&&h!==12) h+=12;
    if(ap==='AM'&&h===12) h=0;
    return {h:h,min:min};
  }
  var p=entry.dateKey.split('-').map(Number);
  var y=p[0],mo=p[1],d=p[2];
  var s0=parseTime(entry.slots[0]);
  var sN=parseTime(entry.slots[entry.slots.length-1]);
  var endMin=sN.min+30,endH=sN.h;
  if(endMin>=60){endH++;endMin-=60;}
  var dtS=y+''+pad(mo)+''+pad(d)+'T'+pad(s0.h)+''+pad(s0.min)+'00';
  var dtE=y+''+pad(mo)+''+pad(d)+'T'+pad(endH)+''+pad(endMin)+'00';
  var now=new Date();
  var stamp=now.getFullYear()+''+pad(now.getMonth()+1)+''+pad(now.getDate())+'T'+pad(now.getHours())+''+pad(now.getMinutes())+''+pad(now.getSeconds())+'Z';
  var rrule='';
  if(entry.recur){
    if(entry.freq==='weekly') rrule='RRULE:FREQ=WEEKLY\r\n';
    else if(entry.freq==='biweekly') rrule='RRULE:FREQ=WEEKLY;INTERVAL=2\r\n';
    else rrule='RRULE:FREQ=MONTHLY\r\n';
  }
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Missionary Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nBEGIN:VEVENT\r\nUID:'+Date.now()+'@missionary\r\nDTSTAMP:'+stamp+'\r\nDTSTART:'+dtS+'\r\nDTEND:'+dtE+'\r\nSUMMARY:Teach With the Missionaries\r\nDESCRIPTION:'+entry.slots.join(', ')+'\\nThank you for serving!\r\n'+rrule+'STATUS:CONFIRMED\r\nEND:VEVENT\r\nEND:VCALENDAR';
}

/* LIST */
function renderList(){
  var el=document.getElementById('signupList');
  document.getElementById('listBadge').textContent=signups.length;
  if(!signups.length){el.innerHTML='<div class="empty-state"><div class="ico">&#128203;</div>No sign-ups yet.</div>';return;}
  var sorted=signups.slice().sort(function(a,b){return new Date(b.created)-new Date(a.created);});
  var html='';
  for(var i=0;i<sorted.length;i++){
    var s=sorted[i];
    var init=initials(s.name);
    var ttags=s.slots.map(function(sl){return '<span class="tag time">'+esc(sl)+'</span>';}).join('');
    var rtag=s.recur?'<span class="tag recur">&#128257; '+esc(s.freq)+'</span>':'';
    html+='<div class="su-entry">'+
      '<div class="avatar">'+init+'</div>'+
      '<div class="ei">'+
        '<div class="ei-name">'+esc(s.name)+'</div>'+
        '<div class="ei-phone">'+esc(s.phone)+'</div>'+
        '<div class="tags">'+ttags+rtag+'</div>'+
        '<div class="ei-date">'+fmtDK(s.dateKey)+'</div>'+
      '</div>'+
      '<div class="entry-actions">'+
        '<button class="icon-btn edit" onclick="openEditModal('+s.id+')" title="Edit">&#9998;&#65039;</button>'+
        '<button class="icon-btn del" onclick="confirmDelete('+s.id+',\''+esc(s.name)+'\')" title="Delete">&#128465;&#65039;</button>'+
      '</div>'+
    '</div>';
  }
  el.innerHTML=html;
}

/* ADMIN */
function populateAdminMonSel(){
  var sel=document.getElementById('adminMon');
  if(sel.options.length>0) return;
  for(var i=-1;i<7;i++){
    var d=new Date(TODAY.getFullYear(),TODAY.getMonth()+i,1);
    var opt=document.createElement('option');
    opt.value=d.getFullYear()+'-'+d.getMonth();
    opt.textContent=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if(i===0) opt.selected=true;
    sel.appendChild(opt);
  }
}

function renderAdmin(){
  var parts=document.getElementById('adminMon').value.split('-').map(Number);
  var y=parts[0],m=parts[1];
  var filter=document.getElementById('adminFilter').value;
  var days=new Date(y,m+1,0).getDate();
  var todayFlat=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
  var mLabel=new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  document.getElementById('printSub').textContent='Availability Schedule - '+mLabel+' - Printed '+new Date().toLocaleDateString();
  var html='',any=false;
  for(var d=1;d<=days;d++){
    var dk=y+'-'+(m+1)+'-'+d;
    var dt=new Date(y,m,d);
    var sus=getDaySUs(dk);
    var isPast=dt<todayFlat;
    if(filter==='upcoming'&&isPast) continue;
    if(filter==='hasSignups'&&sus.length===0) continue;
    any=true;
    var dLabel=dt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    var slotMap={};
    for(var si=0;si<SLOTS.length;si++) slotMap[SLOTS[si]]=[];
    for(var si=0;si<sus.length;si++){
      var s=sus[si];
      for(var sj=0;sj<s.slots.length;sj++){
        if(slotMap[s.slots[sj]]) slotMap[s.slots[sj]].push(s);
      }
    }
    var occupied=SLOTS.filter(function(sl){return slotMap[sl].length>0;});
    var sHtml='';
    if(occupied.length===0){
      sHtml='<div class="no-su">No sign-ups for this day.</div>';
    } else {
      for(var oi=0;oi<occupied.length;oi++){
        var sl=occupied[oi];
        var chips='';
        for(var ci=0;ci<slotMap[sl].length;ci++){
          var s=slotMap[sl][ci];
          var init=initials(s.name);
          var cls=s.recur?' rec':' std';
          chips+='<div class="chip'+cls+'">'+
            '<div class="chip-av">'+init+'</div>'+
            '<div><div class="chip-name">'+esc(s.name)+'</div><div class="chip-ph">'+esc(s.phone)+'</div></div>'+
            '<div class="chip-actions">'+
              '<button class="chip-btn e" onclick="openEditModal('+s.id+')" title="Edit">&#9998;</button>'+
              '<button class="chip-btn d" onclick="confirmDelete('+s.id+',\''+esc(s.name)+'\')" title="Delete">&#x2715;</button>'+
            '</div></div>';
        }
        sHtml+='<div class="tbr"><div class="tbr-time">'+sl+'</div><div class="tbr-people">'+chips+'</div></div>';
      }
    }
    html+='<div class="adb">'+
      '<div class="adb-hdr">'+
        '<div class="adb-date">'+dLabel+'</div>'+
        '<div class="adb-meta">'+
          '<span class="adb-cnt">'+sus.length+' sign-up'+(sus.length!==1?'s':'')+'</span>'+
          '<button class="btn btn-success btn-sm" onclick="openAddModalForDay(\''+dk+'\')">&#xff0b; Add</button>'+
          (sus.length>0?'<button class="btn btn-danger btn-sm" onclick="confirmClearDay(\''+dk+'\',\''+esc(dLabel)+'\')">Clear Day</button>':'')+
        '</div>'+
      '</div>'+
      '<div class="adb-slots">'+sHtml+'</div>'+
    '</div>';
  }
  document.getElementById('adminContent').innerHTML=any?html:'<div class="empty-state"><div class="ico">&#128197;</div>No days match the current filter.</div>';
}

/* EDIT MODAL */
function openEditModal(id){
  var s=null;
  for(var i=0;i<signups.length;i++){if(signups[i].id===id){s=signups[i];break;}}
  if(!s) return;
  editingId=id;
  document.getElementById('editModalTitle').textContent='Edit: '+s.name;
  document.getElementById('eName').value=s.name;
  document.getElementById('ePhone').value=s.phone;
  var p=s.dateKey.split('-').map(Number);
  function pad(n){return String(n).padStart(2,'0');}
  document.getElementById('eDate').value=p[0]+'-'+pad(p[1])+'-'+pad(p[2]);
  var sg=document.getElementById('eSlots');sg.innerHTML='';
  for(var i=0;i<SLOTS.length;i++){
    (function(sl){
      var btn=document.createElement('button');btn.type='button';
      btn.className='msl-btn'+(s.slots.indexOf(sl)>-1?' on':'');
      btn.textContent=sl;btn.onclick=function(){btn.classList.toggle('on');};
      sg.appendChild(btn);
    })(SLOTS[i]);
  }
  document.getElementById('eRecurChk').checked=!!s.recur;
  document.getElementById('eRecurOpts').classList.toggle('open',!!s.recur);
  if(s.freq) document.getElementById('eRecurFreq').value=s.freq;
  document.getElementById('editModal').classList.add('open');
}

function saveEdit(){
  var name=document.getElementById('eName').value.trim();
  var phone=document.getElementById('ePhone').value.trim();
  var dateVal=document.getElementById('eDate').value;
  if(!name){showToast('Name required.',true);return;}
  if(!phone){showToast('Phone required.',true);return;}
  if(!dateVal){showToast('Date required.',true);return;}
  var selSlots=[];
  var btns=document.getElementById('eSlots').querySelectorAll('.msl-btn.on');
  for(var i=0;i<btns.length;i++) selSlots.push(btns[i].textContent);
  if(selSlots.length===0){showToast('Select at least one slot.',true);return;}
  var p=dateVal.split('-').map(Number);
  var newDK=p[0]+'-'+p[1]+'-'+p[2];
  var recur=document.getElementById('eRecurChk').checked;
  var freq=document.getElementById('eRecurFreq').value;
  var dates=recur?buildDates(new Date(p[0],p[1]-1,p[2]),freq):[newDK];
  for(var i=0;i<signups.length;i++){
    if(signups[i].id===editingId){
      signups[i]=Object.assign({},signups[i],{name:name,phone:phone,dateKey:newDK,dates:dates,slots:selSlots,recur:recur,freq:recur?freq:null});
      break;
    }
  }
  save();closeModal('editModal');renderAll();showToast(name+' updated.');
}

/* ADD MODAL */
function openAddModal(){
  resetAddModal();
  var today=new Date();
  function pad(n){return String(n).padStart(2,'0');}
  document.getElementById('aDate').value=today.getFullYear()+'-'+pad(today.getMonth()+1)+'-'+pad(today.getDate());
  document.getElementById('addModal').classList.add('open');
}
function openAddModalForDay(dk){
  resetAddModal();
  var p=dk.split('-').map(Number);
  function pad(n){return String(n).padStart(2,'0');}
  document.getElementById('aDate').value=p[0]+'-'+pad(p[1])+'-'+pad(p[2]);
  document.getElementById('addModal').classList.add('open');
}
function resetAddModal(){
  document.getElementById('aName').value='';
  document.getElementById('aPhone').value='';
  document.getElementById('aDate').value='';
  document.getElementById('aRecurChk').checked=false;
  document.getElementById('aRecurOpts').classList.remove('open');
  var sg=document.getElementById('aSlots');sg.innerHTML='';
  for(var i=0;i<SLOTS.length;i++){
    (function(sl){
      var btn=document.createElement('button');btn.type='button';
      btn.className='msl-btn';btn.textContent=sl;
      btn.onclick=function(){btn.classList.toggle('on');};
      sg.appendChild(btn);
    })(SLOTS[i]);
  }
}
function saveAdd(){
  var name=document.getElementById('aName').value.trim();
  var phone=document.getElementById('aPhone').value.trim();
  var dateVal=document.getElementById('aDate').value;
  if(!name){showToast('Name required.',true);return;}
  if(!phone){showToast('Phone required.',true);return;}
  if(!dateVal){showToast('Date required.',true);return;}
  var selSlots=[];
  var btns=document.getElementById('aSlots').querySelectorAll('.msl-btn.on');
  for(var i=0;i<btns.length;i++) selSlots.push(btns[i].textContent);
  if(selSlots.length===0){showToast('Select at least one slot.',true);return;}
  var p=dateVal.split('-').map(Number);
  var newDK=p[0]+'-'+p[1]+'-'+p[2];
  var recur=document.getElementById('aRecurChk').checked;
  var freq=document.getElementById('aRecurFreq').value;
  var dates=recur?buildDates(new Date(p[0],p[1]-1,p[2]),freq):[newDK];
  signups.push({id:Date.now(),name:name,phone:phone,slots:selSlots,dateKey:newDK,dates:dates,recur:recur,freq:recur?freq:null,created:new Date().toISOString()});
  save();closeModal('addModal');renderAll();showToast(name+' added.');
}

/* DELETE */
function confirmDelete(id,name){
  document.getElementById('confirmMsg').innerHTML='Delete sign-up for <strong>'+esc(name)+'</strong>?<br><small style="color:var(--g4)">This cannot be undone.</small>';
  document.getElementById('confirmOkBtn').onclick=function(){doDelete(id);closeModal('confirmModal');};
  document.getElementById('confirmModal').classList.add('open');
}
function doDelete(id){
  var name='entry';
  for(var i=0;i<signups.length;i++){if(signups[i].id===id){name=signups[i].name;break;}}
  signups=signups.filter(function(s){return s.id!==id;});
  save();renderAll();showToast(name+' removed.');
}
function confirmClearDay(dk,label){
  var cnt=getDaySUs(dk).length;
  document.getElementById('confirmMsg').innerHTML='Delete all <strong>'+cnt+' sign-up'+(cnt!==1?'s':'')+'</strong> for<br><strong>'+esc(label)+'</strong>?<br><small style="color:var(--g4)">This cannot be undone.</small>';
  document.getElementById('confirmOkBtn').onclick=function(){doClearDay(dk);closeModal('confirmModal');};
  document.getElementById('confirmModal').classList.add('open');
}
function doClearDay(dk){
  signups=signups.map(function(s){
    if(!s.dates||s.dates.indexOf(dk)===-1) return s;
    var nd=s.dates.filter(function(d){return d!==dk;});
    if(nd.length===0) return null;
    return Object.assign({},s,{dates:nd});
  }).filter(Boolean);
  save();renderAll();showToast('Day cleared.');
}

/* MODAL HELPERS */
function closeModal(id){ document.getElementById(id).classList.remove('open'); editingId=null; }
var overlays=document.querySelectorAll('.modal-overlay');
for(var i=0;i<overlays.length;i++){
  (function(o){o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('open');});})(overlays[i]);
}

/* RENDER ALL */
function renderAll(){
  renderCalendar();
  if(selDay) renderSlots();
  renderList();
  if(document.getElementById('adminView').classList.contains('active')) renderAdmin();
}

/* PRINT */
function doPrint(){
  document.getElementById('printHdr').style.display='block';
  window.print();
  setTimeout(function(){document.getElementById('printHdr').style.display='none';},1000);
}

/* TOAST */
function showToast(msg,isErr){
  var t=document.getElementById('toast');
  t.textContent=(isErr?'\u26a0 ':'\u2713 ')+msg;
  t.className='toast show'+(isErr?' err':'');
  setTimeout(function(){t.classList.remove('show');},3000);
}

/* INIT */
renderCalendar();
renderList();
