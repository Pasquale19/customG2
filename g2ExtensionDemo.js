"use strict";

var id = null;
const ctx=document.getElementById("cnv").getContext("2d");
const viewport = ctx.canvas.getBoundingClientRect(),  // viewport size ..
        vw = {x:0,y:0,scl:1};
const g = g2().view({vw})// use vw to change view on the run
        .view({cartesian:true})
		.clr().grid()
        .origin({x:0,y:0});

g.nodfix2({x:80,y:80,label:{str:'A0', loc:'n'}});
g.grdline({x1:50,y1:30,x2:200,y2:60, ls:'orange'});
g.grdline({x1:50,y1:170,x2:200,y2:200, ls:'lila', typ:'mid'});
g.grdlines({x:100,y:100,w:Math.PI/4, ls:'green'});
g.slider({x:300,y:300,w:Math.PI/6, ls:'pink', label:{str:'slider'}});

//g.pol({x:365,y:330, label:{label:'pl'}});
//g.pol2({x:365,y:370, label:{label:'pl'}});
/*
//
g.parline({x1:40,y1:40,x2:400,y2:40, i:3});
g.parline({x1:40,y1:60,x2:400,y2:60, label:{str:'labelö'}});
g.parline({x1:0,y1:400,x2:400,y2:60, typ:'cir', ls:'orange', label:{str:'labelö'}});

*/
g.exe(ctx);



        function start(){
        const t=new Testclass();
       const mess= t.test();
            g.parline({x1:40,y1:60,x2:400,y2:60});
//g.grdlines({x:100,y:100,w:Math.PI});

console.log('halo');
        g.exe(ctx);
        }

function drawSymbols(){
g.del().clr();
g.view({vw})// use vw to change view on the run
        .view({cartesian:true})
		.clr().grid()
        .origin({x:0,y:0});
        g.use({grp:'nodfix2',x:200,y:200});
       g.use({grp:g2.symbol.nodfix2,x:300,y:300});
       g.use({grp:'slider',x:400,y:200});
        g.exe(ctx);
}


