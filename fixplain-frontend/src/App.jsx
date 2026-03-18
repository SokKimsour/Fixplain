import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect, useCallback, useRef } from 'react';
import AnimatedBackground from './AnimatedBackground';

const i18n = {
  en: {
    tagline:'Fix it. Explain it. Learn from it.',
    subtitle:'Paste your code — get instant bug fixes, refactors & plain-language explanations.',
    analyzeBtn:'⚡  Analyze & Fix Code', analyzingBtn:'◌  Analyzing...',
    clearBtn:'clear ✕', toAnalyze:'to analyze',
    history:'Recent history', clearAll:'clear all',
    emptyState:'Paste code & press ⌘Enter', noBugs:'No bugs detected',
    commentedLabel:'✦ auto-commented version',
    noCommented:'No commented version returned yet.',
    noCommentedHint:'Ensure your backend returns a commentedCode field.',
    errorMsg:'Analysis failed. Please check your connection or backend.',
    light:'light', dark:'dark', langToggle:'ខ្មែរ', connected:'Connected',
    diffView:'diff', codeView:'code', copied:'Copied to clipboard', exportPDF:'Export PDF',
    historyEmpty:'Analysis result',
    tabs:{ bugs:'Bugs Found', fixed:'Fixed Code', commented:'Commented Code', explain:'Explanation', suggest:'Suggestions' },
    severity:{ high:'high', medium:'medium', low:'low' },
    modes:{ both:'Fix + Refactor', fix:'Fix Only', refactor:'Refactor Only' },
  },
  km: {
    tagline:'ជួសជុល។ ពន្យល់។ រៀនពីវា។',
    subtitle:'បិទភ្ជាប់កូដរបស់អ្នក — ទទួលបានការជួសជុល ការតម្រៀប និងការពន្យល់ភ្លាមៗ។',
    analyzeBtn:'⚡  វិភាគ និងជួសជុល', analyzingBtn:'◌  កំពុងវិភាគ...',
    clearBtn:'លុប ✕', toAnalyze:'ដើម្បីវិភាគ',
    history:'ប្រវត្តិថ្មីៗ', clearAll:'លុបទាំងអស់',
    emptyState:'បិទភ្ជាប់កូដ ហើយចុច ⌘Enter', noBugs:'រកមិនឃើញបញ្ហា',
    commentedLabel:'✦ កំណែមានមតិ',
    noCommented:'API មិនទាន់ត្រឡប់ commentedCode ទេ។',
    noCommentedHint:'សូមបន្ថែម commentedCode field ក្នុង backend។',
    errorMsg:'ការវិភាគបរាជ័យ។ សូមពិនិត្យការតភ្ជាប់ ឬ backend។',
    light:'ស្រាល', dark:'ងងឹត', langToggle:'EN', connected:'បានភ្ជាប់',
    diffView:'diff', codeView:'code', copied:'បានចម្លងទៅ clipboard', exportPDF:'នាំចេញ PDF',
    historyEmpty:'លទ្ធផលវិភាគ',
    tabs:{ bugs:'បញ្ហាដែលរកឃើញ', fixed:'កូដដែលជួសជុល', commented:'កូដមានមតិ', explain:'ការពន្យល់', suggest:'ការណែនាំ' },
    severity:{ high:'ខ្ពស់', medium:'មធ្យម', low:'ទាប' },
    modes:{ both:'ជួសជុល + តម្រៀប', fix:'ជួសជុលតែប៉ុណ្ណោះ', refactor:'តម្រៀបតែប៉ុណ្ណោះ' },
  },
};

const darkTheme = {
  bgBase:'#0d0f12', bgPanel:'#13161b', bgSurface:'#1a1e26',
  border:'#2a2f3d', borderSoft:'#1e2330',
  teal:'#2dd4bf', tealDim:'#1a8a7c', tealGlow:'rgba(45,212,191,0.12)',
  red:'#f87171', redGlow:'rgba(248,113,113,0.08)',
  green:'#4ade80', amber:'#f59e0b', blue:'#60a5fa', purple:'#a78bfa',
  text1:'#e8eaf0', text2:'#8b92a8', text3:'#555e78',
  navBg:'rgba(13,15,18,0.92)', codeTheme:vscDarkPlus, codeBg:'#1a1e26',
  lineNumBg:'#13161b', lineNumColor:'#555e78', isDark:true,
};
const lightTheme = {
  bgBase:'#f5f6f8', bgPanel:'#ffffff', bgSurface:'#f0f1f4',
  border:'#d8dae0', borderSoft:'#e4e6ec',
  teal:'#0d9488', tealDim:'#0f766e', tealGlow:'rgba(13,148,136,0.1)',
  red:'#ef4444', redGlow:'rgba(239,68,68,0.06)',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', purple:'#7c3aed',
  text1:'#111318', text2:'#4b5263', text3:'#9199ab',
  navBg:'rgba(245,246,248,0.94)', codeTheme:oneLight, codeBg:'#f0f1f4',
  lineNumBg:'#ffffff', lineNumColor:'#9199ab', isDark:false,
};

const LANGUAGES = [
  { value:'javascript', label:'JavaScript' }, { value:'nodejs',     label:'Node.js'    },
  { value:'python',     label:'Python'     }, { value:'csharp',     label:'C#'         },
  { value:'sql',        label:'SQL'        }, { value:'typescript', label:'TypeScript' },
  { value:'java',       label:'Java'       }, { value:'php',        label:'PHP'        },
];
const MODES    = ['both','fix','refactor'];
const TAB_KEYS = ['bugs','fixed','commented','explain','suggest'];
const EXT_MAP  = { js:'javascript',jsx:'javascript',ts:'typescript',tsx:'typescript',py:'python',cs:'csharp',sql:'sql',java:'java',php:'php' };
const SEV_STYLE = {
  high:  { dark:{ bg:'rgba(248,113,113,0.12)',color:'#f87171'},light:{ bg:'rgba(239,68,68,0.1)',  color:'#ef4444'}},
  medium:{ dark:{ bg:'rgba(245,158,11,0.12)', color:'#f59e0b'},light:{ bg:'rgba(217,119,6,0.1)', color:'#d97706'}},
  low:   { dark:{ bg:'rgba(96,165,250,0.12)', color:'#60a5fa'},light:{ bg:'rgba(37,99,235,0.1)', color:'#2563eb'}},
};
const mono  = "'JetBrains Mono', monospace";
const sans  = "'Sora', sans-serif";
const khmer = "'Hanuman','Noto Sans Khmer',sans-serif";

const normalizeBugs = b => !b?.length ? [] : b.map(x => typeof x==='string'?{issue:x,severity:'medium'}:x);

function computeDiff(o,f){
  const ol=(o||'').split('\n'),fl=(f||'').split('\n'),len=Math.max(ol.length,fl.length);
  return Array.from({length:len},(_,i)=>{
    const a=ol[i],b=fl[i];
    if(a===undefined)return{orig:'',fixed:b,type:'added'};
    if(b===undefined)return{orig:a,fixed:'',type:'removed'};
    if(a!==b)return{orig:a,fixed:b,type:'changed'};
    return{orig:a,fixed:b,type:'same'};
  });
}

async function exportToPDF(result, lang, mode, locale, t) {
  const { default: jsPDF } = await import('jspdf');
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,M=18,CW=W-M*2; let y=20;
  const wrap=(txt,opts={})=>{
    const{size=10,bold=false,color=[180,190,200],indent=0,lh=6}=opts;
    doc.setFontSize(size);doc.setFont('helvetica',bold?'bold':'normal');doc.setTextColor(...color);
    doc.splitTextToSize(String(txt||''),CW-indent).forEach(line=>{
      if(y>275){doc.addPage();y=20;}
      doc.text(line,M+indent,y);y+=lh;
    });
  };
  const section=(title,col=[45,212,191])=>{
    if(y>258){doc.addPage();y=20;}
    y+=4;doc.setDrawColor(...col);doc.setLineWidth(0.4);
    doc.line(M,y,W-M,y);y+=5;
    wrap(title,{size:13,bold:true,color:col});y+=2;
  };
  doc.setFillColor(13,15,18);doc.rect(0,0,W,28,'F');
  doc.setFontSize(20);doc.setFont('helvetica','bold');doc.setTextColor(45,212,191);
  doc.text('fixplain',M,17);
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(139,146,168);
  doc.text(`${lang.toUpperCase()}  ·  ${mode}  ·  ${new Date().toLocaleDateString()}`,M,24);
  y=38;
  const bugs=normalizeBugs(result.bugsFound);
  section(locale==='km'?'បញ្ហាដែលរកឃើញ':'Bugs Found',[248,113,113]);
  if(!bugs.length){wrap(locale==='km'?'រកមិនឃើញបញ្ហា':'No bugs detected.',{color:[74,222,128]});}
  else bugs.forEach((b,i)=>{
    const sc=b.severity==='high'?[248,113,113]:b.severity==='low'?[96,165,250]:[245,158,11];
    wrap(`${i+1}. [${(b.severity||'medium').toUpperCase()}] ${b.issue}`,{indent:2,color:sc});
  });
  section(locale==='km'?'កូដដែលជួសជុល':'Fixed Code',[74,222,128]);
  wrap(result.fixedCode||'',{size:8,color:[180,190,200],lh:4.5});
  section(locale==='km'?'ការពន្យល់':'Explanation',[96,165,250]);
  wrap(result.explanation||'',{lh:5.5});
  section(locale==='km'?'ការណែនាំ':'Suggestions',[167,139,250]);
  (result.improvementSuggestions||[]).forEach((s,i)=>wrap(`${i+1}. ${s}`,{indent:2,lh:5.5}));
  const pages=doc.internal.getNumberOfPages();
  for(let p=1;p<=pages;p++){
    doc.setPage(p);doc.setFontSize(8);doc.setTextColor(85,94,120);
    doc.text('fixplain — Fix it. Explain it. Learn from it.',M,290);
    doc.text(`${p} / ${pages}`,W-M,290,{align:'right'});
  }
  doc.save(`fixplain-${lang}-${new Date().toISOString().slice(0,10)}.pdf`);
}

const Panel=({c,children,style={},...rest})=>(
  <div style={{background:c.bgPanel,border:`1px solid ${c.borderSoft}`,borderRadius:16,overflow:'hidden',display:'flex',flexDirection:'column',...style}} {...rest}>{children}</div>
);
const PanelHeader=({c,children})=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${c.borderSoft}`,background:c.bgSurface,flexWrap:'wrap',gap:6}}>{children}</div>
);
const Dot=({color})=><span style={{width:6,height:6,borderRadius:'50%',background:color,display:'inline-block'}}/>;

const SeverityBadge=({severity,isDark,label})=>{
  const st=(SEV_STYLE[severity]||SEV_STYLE.low)[isDark?'dark':'light'];
  return <span style={{fontFamily:mono,fontSize:9,fontWeight:600,padding:'2px 7px',borderRadius:20,background:st.bg,color:st.color,letterSpacing:'0.5px',textTransform:'uppercase',flexShrink:0}}>{label}</span>;
};

const Toast=({message,visible,c})=>(
  <div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',background:c.bgSurface,border:`1px solid ${c.green}`,color:c.green,fontFamily:mono,fontSize:12,padding:'8px 18px',borderRadius:20,opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(8px)',transition:'opacity 0.25s,transform 0.25s',pointerEvents:'none',zIndex:200}}>
    ✓ {message}
  </div>
);

function DiffView({original,fixed,c}){
  const diff=computeDiff(original,fixed);
  const col=(type,side)=>{
    if(type==='same')return'transparent';
    return side==='orig'?(c.isDark?'rgba(248,113,113,0.1)':'rgba(239,68,68,0.06)'):(c.isDark?'rgba(74,222,128,0.1)':'rgba(22,163,74,0.06)');
  };
  return(
    <div style={{borderRadius:10,overflow:'hidden',border:`1px solid ${c.borderSoft}`,display:'grid',gridTemplateColumns:'1fr 1fr'}}>
      {['orig','fixed'].map(side=>(
        <div key={side} style={{borderRight:side==='orig'?`1px solid ${c.borderSoft}`:'none'}}>
          <div style={{padding:'6px 12px',background:c.bgSurface,borderBottom:`1px solid ${c.borderSoft}`,fontFamily:mono,fontSize:10,color:side==='orig'?c.red:c.green}}>{side==='orig'?'original':'fixed'}</div>
          <div style={{overflowX:'auto'}}>
            {diff.map((row,i)=>(
              <div key={i} style={{display:'flex',gap:8,padding:'0 10px',background:col(row.type,side),minHeight:22}}>
                <span style={{fontFamily:mono,fontSize:11,color:c.text3,minWidth:22,userSelect:'none',lineHeight:'22px'}}>{i+1}</span>
                <span style={{fontFamily:mono,fontSize:12,color:c.text2,whiteSpace:'pre',lineHeight:'22px',flex:1}}>{side==='orig'?row.orig:row.fixed}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton({c}){
  return(
    <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        {[0,1,2,3,4].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:c.teal,display:'inline-block',animation:`fpShimmer 1.2s ease-in-out ${i*0.15}s infinite`}}/>)}
        <span style={{fontFamily:mono,fontSize:11,color:c.text3,marginLeft:4}}>analyzing...</span>
      </div>
      {[[28,88,60],[35,92,72],[20,78]].map((ws,gi)=>(
        <div key={gi} style={{display:'flex',flexDirection:'column',gap:7}}>
          {ws.map((w,i)=><div key={i} style={{height:i===0?11:8,width:`${w}%`,background:c.bgSurface,borderRadius:6,animation:`fpShimmer 1.6s ease-in-out ${gi*0.2}s infinite`}}/>)}
        </div>
      ))}
    </div>
  );
}

function LineNumberedEditor({c,value,onChange,isDragging}){
  const taRef=useRef(null),lnRef=useRef(null);
  const lines=value.split('\n');
  const sync=()=>{if(lnRef.current&&taRef.current)lnRef.current.scrollTop=taRef.current.scrollTop;};
  return(
    <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0,position:'relative'}}>
      {isDragging&&<div style={{position:'absolute',inset:0,background:c.isDark?'rgba(45,212,191,0.08)':'rgba(13,148,136,0.06)',border:`2px dashed ${c.teal}`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',zIndex:5}}><span style={{fontFamily:mono,fontSize:13,color:c.teal}}>⬇ drop file</span></div>}
      <div ref={lnRef} style={{background:c.lineNumBg,borderRight:`1px solid ${c.borderSoft}`,padding:'1rem 10px 1rem 12px',textAlign:'right',fontFamily:mono,fontSize:12,lineHeight:1.8,color:c.lineNumColor,userSelect:'none',overflowY:'hidden',minWidth:44,flexShrink:0}}>
        {lines.map((_,i)=><div key={i}>{i+1}</div>)}
      </div>
      <textarea ref={taRef} value={value} onChange={e=>onChange(e.target.value)} onScroll={sync} spellCheck={false}
        style={{flex:1,background:'transparent',border:'none',outline:'none',color:c.text1,fontFamily:mono,fontSize:13,lineHeight:1.8,padding:'1rem 1.25rem',resize:'none',tabSize:2,overflowY:'auto'}}/>
    </div>
  );
}

export default function App(){
  const [isDark,setIsDark]=useState(true);
  const [locale,setLocale]=useState('en');
  const [language,setLanguage]=useState('javascript');
  const [mode,setMode]=useState('both');
  const [codeInput,setCodeInput]=useState('// Paste your code here...\nfunction example() {\n  let x = 10\n  console.log(x)\n}');
  const [isLoading,setIsLoading]=useState(false);
  const [isExporting,setIsExporting]=useState(false);
  const [error,setError]=useState(null);
  const [analysisResult,setAnalysisResult]=useState(null);
  const [history,setHistory]=useState([]);
  const [activeTab,setActiveTab]=useState('bugs');
  const [showDiff,setShowDiff]=useState(false);
  const [isDragging,setIsDragging]=useState(false);
  const [toastMsg,setToastMsg]=useState('');
  const [toastVisible,setToastVisible]=useState(false);
  const [tabKey,setTabKey]=useState(0);
  const [mobileTab,setMobileTab]=useState('input');
  const [screenW,setScreenW]=useState(window.innerWidth);

  const isMobile=screenW<768;
  const isTablet=screenW>=768&&screenW<1024;
  const c=isDark?darkTheme:lightTheme;
  const t=i18n[locale];
  const tf=locale==='km'?khmer:sans;

  useEffect(()=>{const h=()=>setScreenW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  useEffect(()=>{
    const s=document.createElement('style');s.id='fp-styles';
    s.textContent='@keyframes fpFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes fpShimmer{0%,100%{opacity:.3}50%{opacity:.8}}';
    if(!document.getElementById('fp-styles'))document.head.appendChild(s);
  },[]);
  useEffect(()=>{const s=localStorage.getItem('fixplain_history');if(s)setHistory(JSON.parse(s));},[]);
  useEffect(()=>{
    const h=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(!isLoading&&codeInput.trim())handleAnalyze();}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[isLoading,codeInput]);

  const showToast=msg=>{setToastMsg(msg);setToastVisible(true);setTimeout(()=>setToastVisible(false),2200);};
  const handleCopy=text=>{navigator.clipboard.writeText(text);showToast(t.copied);};
  const clearHistory=()=>{setHistory([]);localStorage.removeItem('fixplain_history');};
  const handleDragOver=e=>{e.preventDefault();setIsDragging(true);};
  const handleDragLeave=e=>{e.preventDefault();setIsDragging(false);};
  const handleDrop=e=>{
    e.preventDefault();setIsDragging(false);
    const file=e.dataTransfer.files[0];if(!file)return;
    const ext=file.name.split('.').pop().toLowerCase();
    if(EXT_MAP[ext])setLanguage(EXT_MAP[ext]);
    const r=new FileReader();r.onload=ev=>setCodeInput(ev.target.result);r.readAsText(file);
  };
  const switchTab=key=>{setActiveTab(key);setTabKey(k=>k+1);setShowDiff(false);if(isMobile)setMobileTab('output');};
  const handleAnalyze=useCallback(async()=>{
    setIsLoading(true);setError(null);setAnalysisResult(null);switchTab('bugs');
    if(isMobile)setMobileTab('output');
    try{
      const res=await fetch('https://ffxplain-api.onrender.com/api/fix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({codeInput,language,mode,locale})});
      if(!res.ok)throw new Error();
      const data=await res.json();
      setAnalysisResult(data);
      if(!normalizeBugs(data.bugsFound).length)switchTab('fixed');
      const entry={...data,_meta:{language,mode,locale,time:Date.now()}};
      const updated=[entry,...history].slice(0,5);
      setHistory(updated);localStorage.setItem('fixplain_history',JSON.stringify(updated));
    }catch{setError(t.errorMsg);}
    finally{setIsLoading(false);}
  },[codeInput,language,mode,locale,history,t,isMobile]);

  const handleExportPDF=async()=>{
    if(!analysisResult)return;
    setIsExporting(true);
    try{await exportToPDF(analysisResult,language,mode,locale,t);showToast('PDF exported!');}
    catch{showToast('Export failed — try again');}
    finally{setIsExporting(false);}
  };

  const bugs=normalizeBugs(analysisResult?.bugsFound);
  const tabAccent={bugs:c.red,fixed:c.green,commented:c.amber,explain:c.blue,suggest:c.purple};
  const langHL={nodejs:'javascript',csharp:'csharp',sql:'sql',python:'python',typescript:'typescript',java:'java',php:'php'}[language]||'javascript';
  const fileExt=({python:'py',sql:'sql',csharp:'cs',java:'java',php:'php',typescript:'ts'})[language]||'js';

  const CopyBtn=({text})=>(
    <button onClick={()=>handleCopy(text)} style={{fontFamily:mono,fontSize:10,fontWeight:600,padding:'4px 14px',borderRadius:20,border:`1px solid ${c.border}`,background:'transparent',color:c.text2,cursor:'pointer',transition:'0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=c.green;e.currentTarget.style.color=c.green;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=c.border;e.currentTarget.style.color=c.text2;}}>copy</button>
  );

  const LeftPanel=()=>(
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <Panel c={c} style={{flex:1,minHeight:isMobile?260:380}} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <PanelHeader c={c}>
          <span style={{fontFamily:mono,fontSize:11,color:c.text3,display:'flex',alignItems:'center',gap:6}}>
            <Dot color={c.amber}/><Dot color={c.green}/><Dot color={c.red}/>&nbsp;input.{fileExt}
            {!isMobile&&<span style={{fontSize:9,color:c.text3,marginLeft:4}}>· drag &amp; drop</span>}
          </span>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {MODES.map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{fontFamily:tf,fontSize:isMobile?9:10,fontWeight:500,padding:isMobile?'3px 7px':'4px 10px',borderRadius:20,border:`1px solid ${mode===m?c.tealDim:c.border}`,background:mode===m?c.tealGlow:'transparent',color:mode===m?c.teal:c.text3,cursor:'pointer',transition:'0.15s'}}
                onMouseEnter={e=>{if(mode!==m){e.currentTarget.style.borderColor=c.tealDim;e.currentTarget.style.color=c.teal;}}}
                onMouseLeave={e=>{if(mode!==m){e.currentTarget.style.borderColor=c.border;e.currentTarget.style.color=c.text3;}}}>
                {isMobile?(m==='both'?'⚡':m==='fix'?'🐛':'✨'):t.modes[m]}
              </button>
            ))}
          </div>
          <button onClick={()=>setCodeInput('')} style={{background:'none',border:'none',cursor:'pointer',color:c.text3,fontSize:11,fontFamily:mono,padding:'2px 8px',borderRadius:5,transition:'0.15s'}}
            onMouseEnter={e=>e.target.style.color=c.text1} onMouseLeave={e=>e.target.style.color=c.text3}>{t.clearBtn}</button>
        </PanelHeader>
        <LineNumberedEditor c={c} value={codeInput} onChange={setCodeInput} isDragging={isDragging}/>
      </Panel>
      <button onClick={handleAnalyze} disabled={isLoading||!codeInput.trim()}
        style={{fontFamily:tf,fontSize:isMobile?12:13,fontWeight:600,padding:'13px 0',borderRadius:30,border:`1.5px solid ${c.tealDim}`,background:isLoading?'transparent':c.tealGlow,color:c.teal,cursor:(isLoading||!codeInput.trim())?'not-allowed':'pointer',transition:'all 0.2s',opacity:(!codeInput.trim()&&!isLoading)?0.4:1,width:'100%'}}>
        {isLoading?t.analyzingBtn:t.analyzeBtn}
      </button>
      {history.length>0&&!isMobile&&(
        <Panel c={c}>
          <PanelHeader c={c}>
            <span style={{fontFamily:tf,fontSize:11,color:c.text3,letterSpacing:'0.4px',textTransform:'uppercase'}}>{t.history}</span>
            <button onClick={clearHistory} style={{background:'none',border:'none',cursor:'pointer',color:c.red,fontFamily:tf,fontSize:10,letterSpacing:'0.4px',textTransform:'uppercase'}}>{t.clearAll}</button>
          </PanelHeader>
          <div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}>
            {history.map((item,idx)=>{
              const meta=item._meta||{};
              const fb=item.bugsFound?.[0];
              const bl=typeof fb==='string'?fb:fb?.issue;
              return(
                <button key={idx} onClick={()=>{setAnalysisResult(item);switchTab('bugs');}}
                  style={{width:'100%',textAlign:'left',padding:'9px 12px',background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:8,color:c.text2,fontFamily:mono,fontSize:12,cursor:'pointer',transition:'0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=c.tealDim;e.currentTarget.style.color=c.teal;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=c.border;e.currentTarget.style.color=c.text2;}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                    {meta.language&&<span style={{fontFamily:mono,fontSize:9,padding:'1px 6px',borderRadius:10,background:c.tealGlow,color:c.teal}}>{LANGUAGES.find(l=>l.value===meta.language)?.label}</span>}
                    {meta.mode&&<span style={{fontFamily:mono,fontSize:9,padding:'1px 6px',borderRadius:10,background:'rgba(167,139,250,0.1)',color:c.purple}}>{meta.mode}</span>}
                    {meta.locale==='km'&&<span style={{fontFamily:mono,fontSize:9,padding:'1px 6px',borderRadius:10,background:'rgba(245,158,11,0.1)',color:c.amber}}>ខ្មែរ</span>}
                    {meta.time&&<span style={{fontFamily:mono,fontSize:9,color:c.text3,marginLeft:'auto'}}>{new Date(meta.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
                  </div>
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>◈  {bl||t.historyEmpty}</div>
                </button>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );

  const RightPanel=()=>(
    <Panel c={c} style={{minHeight:isMobile?300:380}}>
      <div style={{display:'flex',borderBottom:`1px solid ${c.borderSoft}`,background:c.bgSurface,overflowX:'auto'}}>
        {TAB_KEYS.map(key=>{
          const accent=tabAccent[key],isActive=activeTab===key,bc=key==='bugs'&&analysisResult?bugs.length:0;
          return(
            <button key={key} onClick={()=>switchTab(key)}
              style={{fontFamily:tf,fontSize:isMobile?10:11,padding:isMobile?'8px 10px':'10px 13px',border:'none',background:'none',color:isActive?accent:c.text3,borderBottom:isActive?`2px solid ${accent}`:'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap',transition:'color 0.15s',display:'flex',alignItems:'center',gap:5}}
              onMouseEnter={e=>{if(!isActive)e.currentTarget.style.color=c.text1;}}
              onMouseLeave={e=>{if(!isActive)e.currentTarget.style.color=c.text3;}}>
              {t.tabs[key]}
              {bc>0&&<span style={{background:c.red,color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:20,lineHeight:1.4}}>{bc}</span>}
            </button>
          );
        })}
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
        {analysisResult&&!isLoading&&(
          <div style={{padding:'8px 14px 0',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={handleExportPDF} disabled={isExporting}
              style={{fontFamily:tf,fontSize:10,fontWeight:600,padding:'5px 14px',borderRadius:20,border:`1px solid ${c.amber}`,background:'rgba(245,158,11,0.08)',color:c.amber,cursor:isExporting?'wait':'pointer',transition:'0.2s',display:'flex',alignItems:'center',gap:6}}>
              {isExporting?'◌':'↓'} {t.exportPDF}
            </button>
          </div>
        )}
        {error&&<div style={{margin:'1rem',padding:'12px 16px',background:c.redGlow,border:`1px solid ${c.red}`,borderLeft:`3px solid ${c.red}`,borderRadius:10,color:c.red,fontFamily:tf,fontSize:12}}>{error}</div>}
        {isLoading&&<LoadingSkeleton c={c}/>}
        {!analysisResult&&!isLoading&&!error&&(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:10,padding:'3rem'}}>
            <span style={{fontSize:30,opacity:0.2}}>◈</span>
            <span style={{color:c.text3,fontFamily:tf,fontSize:12}}>{t.emptyState}</span>
          </div>
        )}
        {analysisResult&&!isLoading&&(
          <div key={tabKey} style={{padding:'1rem 1.25rem',flex:1,animation:'fpFadeIn 0.2s ease'}}>
            {activeTab==='bugs'&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {!bugs.length?(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'2rem',color:c.green}}>
                    <span style={{fontSize:28}}>✓</span>
                    <span style={{fontFamily:tf,fontSize:12}}>{t.noBugs}</span>
                  </div>
                ):bugs.map((b,i)=>(
                  <div key={i} style={{padding:'10px 14px',background:c.redGlow,borderLeft:`2px solid ${c.red}`,borderRadius:'0 8px 8px 0',display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{color:c.red,marginTop:1,flexShrink:0}}>✗</span>
                    <span style={{fontFamily:mono,fontSize:isMobile?11.5:12.5,color:c.text2,lineHeight:1.65,flex:1}}>{b.issue}</span>
                    <SeverityBadge severity={b.severity} isDark={isDark} label={t.severity[b.severity]||b.severity}/>
                  </div>
                ))}
              </div>
            )}
            {activeTab==='fixed'&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:4}}>
                    {[false,true].map(d=>(
                      <button key={String(d)} onClick={()=>setShowDiff(d)}
                        style={{fontFamily:mono,fontSize:10,padding:'4px 10px',borderRadius:20,border:`1px solid ${showDiff===d?c.tealDim:c.border}`,background:showDiff===d?c.tealGlow:'transparent',color:showDiff===d?c.teal:c.text3,cursor:'pointer',transition:'0.15s'}}>
                        {d?t.diffView:t.codeView}
                      </button>
                    ))}
                  </div>
                  <CopyBtn text={analysisResult.fixedCode}/>
                </div>
                {showDiff?<DiffView original={codeInput} fixed={analysisResult.fixedCode} c={c}/>
                  :<SyntaxHighlighter language={langHL} style={c.codeTheme} customStyle={{margin:0,borderRadius:10,fontSize:isMobile?11:12.5,lineHeight:1.75,background:c.codeBg}}>{analysisResult.fixedCode}</SyntaxHighlighter>}
              </div>
            )}
            {activeTab==='commented'&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontFamily:tf,fontSize:11,color:c.amber}}>{t.commentedLabel}</span>
                  <CopyBtn text={analysisResult.commentedCode||analysisResult.fixedCode}/>
                </div>
                {analysisResult.commentedCode
                  ?<SyntaxHighlighter language={langHL} style={c.codeTheme} customStyle={{margin:0,borderRadius:10,fontSize:isMobile?11:12.5,lineHeight:1.75,background:c.codeBg}}>{analysisResult.commentedCode}</SyntaxHighlighter>
                  :<div style={{padding:'1.5rem',background:c.bgSurface,borderRadius:10,fontFamily:tf,fontSize:12,color:c.text3,textAlign:'center',lineHeight:1.8}}>{t.noCommented}<br/><span style={{color:c.amber}}>{t.noCommentedHint}</span></div>}
              </div>
            )}
            {activeTab==='explain'&&<p style={{fontFamily:tf,fontSize:isMobile?12:13,color:c.text2,lineHeight:1.9,margin:0}}>{analysisResult.explanation}</p>}
            {activeTab==='suggest'&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {analysisResult.improvementSuggestions?.map((s,i)=>(
                  <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <span style={{minWidth:24,height:24,borderRadius:'50%',background:isDark?'rgba(167,139,250,0.1)':'rgba(124,58,237,0.08)',color:c.purple,fontSize:10,fontWeight:600,fontFamily:mono,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1,flexShrink:0}}>{i+1}</span>
                    <span style={{fontFamily:tf,fontSize:isMobile?12:12.5,color:c.text2,lineHeight:1.65}}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );

  return(
    <div style={{minHeight:'100vh',background:c.bgBase,color:c.text1,fontFamily:tf,display:'flex',flexDirection:'column',transition:'background 0.2s,color 0.2s'}}>
      <AnimatedBackground isDark={isDark}/>
      <nav style={{borderBottom:`1px solid ${c.borderSoft}`,padding:'0 1.25rem',height:isMobile?50:56,display:'flex',alignItems:'center',justifyContent:'space-between',background:c.navBg,backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:c.teal,display:'inline-block'}}/>
          <span style={{fontFamily:mono,fontSize:isMobile?13:15,fontWeight:600,color:c.teal,letterSpacing:'-0.3px'}}>fixplain</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?6:8}}>
          <select value={language} onChange={e=>setLanguage(e.target.value)} style={{background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:8,color:c.text1,fontFamily:mono,fontSize:isMobile?11:12,padding:isMobile?'4px 8px':'6px 10px',cursor:'pointer',outline:'none'}}>
            {LANGUAGES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          {!isMobile&&(
            <span style={{fontSize:10,fontFamily:mono,color:c.text3,display:'flex',alignItems:'center',gap:4}}>
              <kbd style={{background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:4,padding:'1px 5px',fontSize:10,color:c.text3}}>{navigator.platform?.includes('Mac')?'⌘':'Ctrl'}</kbd>
              <kbd style={{background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:4,padding:'1px 5px',fontSize:10,color:c.text3}}>Enter</kbd>
              <span>{t.toAnalyze}</span>
            </span>
          )}
          <button onClick={()=>setLocale(l=>l==='en'?'km':'en')} style={{background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:20,padding:isMobile?'4px 10px':'5px 12px',cursor:'pointer',fontFamily:locale==='km'?mono:khmer,fontSize:11,color:c.text2,transition:'0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=c.tealDim} onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}>{t.langToggle}</button>
          <button onClick={()=>setIsDark(p=>!p)} style={{background:c.bgSurface,border:`1px solid ${c.border}`,borderRadius:20,padding:isMobile?'4px 10px':'5px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:mono,fontSize:11,color:c.text2,transition:'0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=c.tealDim} onMouseLeave={e=>e.currentTarget.style.borderColor=c.border}>
            <span style={{fontSize:13}}>{isDark?'☀':'☾'}</span>
            {!isMobile&&(isDark?t.light:t.dark)}
          </button>
        </div>
      </nav>

      <div style={{textAlign:'center',padding:isMobile?'1.5rem 1.25rem 0.75rem':'2.5rem 1.25rem 1rem',position:'relative',zIndex:1}}>
        <h1 style={{fontSize:isMobile?'clamp(20px,6vw,28px)':'clamp(22px,4vw,40px)',fontWeight:600,letterSpacing:locale==='km'?0:'-1px',lineHeight:1.3,margin:0,fontFamily:tf}}>
          {locale==='km'?t.tagline:<>Fix it. <span style={{color:c.teal}}>Explain it.</span> Learn from it.</>}
        </h1>
        <p style={{marginTop:8,fontSize:isMobile?12:13,color:c.text2,fontWeight:300,fontFamily:tf}}>{t.subtitle}</p>
      </div>

      {isMobile&&(
        <div style={{display:'flex',margin:'0.75rem 1.25rem 0',background:c.bgSurface,borderRadius:30,padding:3,position:'relative',zIndex:1}}>
          {['input','output'].map(tab=>(
            <button key={tab} onClick={()=>setMobileTab(tab)} style={{flex:1,fontFamily:tf,fontSize:12,fontWeight:500,padding:'8px 0',borderRadius:27,border:'none',background:mobileTab===tab?c.bgPanel:'transparent',color:mobileTab===tab?c.teal:c.text3,cursor:'pointer',transition:'0.15s'}}>
              {tab==='input'?'✏ Code':'◈ Results'}
            </button>
          ))}
        </div>
      )}

      <main style={{width:'100%',padding:isMobile?'0.75rem 1.25rem 2rem':'1.5rem 1.25rem 2rem',display:isMobile?'flex':'grid',flexDirection:'column',gridTemplateColumns:isTablet?'1fr':'1fr 1fr',gap:'1.25rem',flex:1,position:'relative',zIndex:1}}>
        {isMobile?(
          <>{mobileTab==='input'&&<LeftPanel/>}{mobileTab==='output'&&<RightPanel/>}</>
        ):isTablet?(
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}><LeftPanel/><RightPanel/></div>
        ):(
          <><LeftPanel/><RightPanel/></>
        )}
      </main>

      {!isMobile&&(
        <div style={{display:'flex',alignItems:'center',gap:8,fontFamily:mono,fontSize:10,color:c.text3,padding:'0 1.25rem 1rem',position:'relative',zIndex:1}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:c.green,display:'inline-block'}}/>
          {t.connected} · ffxplain-api.onrender.com &nbsp;·&nbsp; {LANGUAGES.find(l=>l.value===language)?.label} &nbsp;·&nbsp; {t.modes[mode]}
        </div>
      )}
      <Toast message={toastMsg} visible={toastVisible} c={c}/>
    </div>
  );
}
