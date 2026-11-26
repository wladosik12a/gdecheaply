import {useEffect,useRef} from 'react';
// Update only transforms during animation; React renders only UI state changes.
export function useConveyorMotion(belt, paused, open, count) {
 const motion=useRef({offset:0,target:null,velocity:0,hover:false,drag:null,skipClick:false});
 const flags=useRef({paused,open});flags.current={paused,open};
 useEffect(()=>{
  const el=belt.current;if(!el)return;let frame,last=0,width=el.clientWidth,height=el.clientHeight;
  const resize=new ResizeObserver(([entry])=>{width=entry.contentRect.width;height=entry.contentRect.height});resize.observe(el);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const tick=time=>{
   const dt=Math.min((time-last)/1000||0,.05);last=time;const m=motion.current;
   const visible=!document.hidden&&document.getElementById('menu')?.classList.contains('on');
   if(visible){
    if(m.target!==null){const delta=m.target-m.offset;m.offset+=delta*(reduce.matches?1:1-Math.exp(-7*dt));if(Math.abs(delta)<.001){m.offset=m.target;m.target=null;}}
    else if(!m.drag){const goal=(!flags.current.paused&&!flags.current.open&&!m.hover&&!reduce.matches)?.12:0;m.velocity+=(goal-m.velocity)*(1-Math.exp(-5*dt));m.offset+=m.velocity*dt;}
    el.querySelectorAll('.conveyor-plate').forEach((plate,i)=>{const a=m.offset+i*Math.PI*2/count,depth=(Math.sin(a)+1)/2;plate.style.transform=`translate3d(${width*.36*Math.cos(a)}px,${height*.29*Math.sin(a)}px,0) translate(-50%,-50%) scale(${.76+.24*depth})`;plate.style.zIndex=String(Math.round(10+depth*10));});
   }
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);resize.disconnect()};
 },[count,belt]);
 return {
  step: direction=>{const m=motion.current;m.target=(m.target??m.offset)+direction*Math.PI*2/count;},
  handlers:{
   onPointerEnter:e=>{if(e.pointerType==='mouse')motion.current.hover=true},
   onPointerLeave:()=>{motion.current.hover=false},
   onPointerDown:e=>{if(e.button!==0)return;const m=motion.current;m.target=null;m.skipClick=false;m.drag={x:e.clientX,start:e.clientX,offset:m.offset,id:e.pointerId};},
   onPointerMove:e=>{const m=motion.current;if(!m.drag)return;const dx=e.clientX-m.drag.start;if(Math.abs(dx)>8){m.skipClick=true;belt.current.setPointerCapture(e.pointerId);m.offset=m.drag.offset+dx/Math.max(1,belt.current.clientWidth)*Math.PI*2;m.velocity=0;}},
   onPointerUp:()=>{motion.current.drag=null},
   onPointerCancel:()=>{motion.current.drag=null;motion.current.skipClick=true},
   onClickCapture:e=>{if(motion.current.skipClick){e.preventDefault();e.stopPropagation();motion.current.skipClick=false;}}
  }
 };
}
