import { spawnSync } from 'node:child_process';
const r=spawnSync('npx',['--yes','hyperframes@0.9.26','render','--quality','delivery','-o','../delivery/ArenaCover_Demo90s.mp4'],{cwd:'video',stdio:'inherit'});
if(r.status!==0)process.exit(r.status??1);
