'use client';
import { Bookmark, Clock, Globe2, ArrowUpRight, Gift, Play, MonitorPlay, Radio } from 'lucide-react';
import {Quest,title,reward,regionText,kind,image,duration} from '@/lib/types';
export function QuestCard({quest,saved,onSave,onOpen,list=false}:{quest:Quest;saved:boolean;onSave:()=>void;onOpen:()=>void;list?:boolean}){
 const q=quest;const days=Math.ceil((Date.parse(q.config.expires_at)-Date.now())/86400000);const k=kind(q);const Icon=k==='Watch'?MonitorPlay:k==='Stream'?Radio:Play;
 return <article className={'quest-card '+(list?'list-card':'')}>
  <div className="quest-content"><div className="quest-icon-row"><button className="quest-icon" onClick={onOpen} aria-label={'View '+title(q)}>{image(q)?<img src={image(q)} alt="" loading="lazy"/>:<Icon size={19}/>}</button><button className={'save '+(saved?'saved':'')} onClick={onSave} aria-label={saved?'Remove bookmark':'Bookmark quest'}><Bookmark size={17} fill={saved?'currentColor':'none'}/></button></div>
  <div className="quest-head"><div><h3>{title(q)}</h3><p>{q.config.messages?.game_title||q.config.messages?.game_publisher||'Discord Quest'}</p></div></div>
  <div className="quest-description"><Gift size={13}/><span>{reward(q)}</span></div>
  <div className="meta-row"><span className="tag purple">{k}</span><span className="tag blue">{duration(q)}</span>{days<=3&&<span className="tag amber">Ending soon</span>}</div>
  <div className="quest-info"><span><Globe2 size={14}/>{regionText(q.region)}</span></div>
  <div className="card-bottom"><span><Clock size={13}/> {days<=1?'Ends today':`${days} days left`}</span><button onClick={onOpen}>View details <ArrowUpRight size={14}/></button></div></div>
 </article>
}
