const fs = require('fs')
const DEBUG = false
function run(prog, text) {
    const ll = prog.split("\n").map(l => {
      m = l.match(/(.*?)($|\t(\w+)(\s(.*))?)/)
      if (!m) throw l
      return [m[1],m[3],m[5]]
    });
    let pc = 0
    let ix = 1
    let flag = true;
    let tok
    let l1 = ''
    let l2 = ''
    let rval = ''
    let out = "\t"
    let pos = 0
    let stack = []
    const jump = label => pc = ll.findIndex(l => l[0] === label)
    const skipws = () => { while (" \t\n".indexOf(text[pos])>=0) pos++ }
    jump(ll[pc][2])
    const isAlpha = c => c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z'
    const isDigit = c => c >= '0' && c <= '9'
    const isIdent = c => isAlpha(c) || isDigit(c)
    const fail = msg => {throw `unknow op ${msg}`}
    const token = (first,rest) => {
      skipws()
      const s = pos
      if (first(text[pos])) { pos++; while (rest(text[pos])) pos++}
      flag = pos != s
      if (flag) tok = text.slice(s,pos)
      DEBUG && console.log('tok',s,pos,flag,tok)
    }
    const ops = {
      SET() { flag = true },
      B(arg) { jump(arg) }, // UNUSED
      BT(arg) { flag && jump(arg) },
      BF(arg) { flag || jump(arg) },
      BE() { if (!flag) throw "Error"},
      ID() { token(isAlpha,isIdent) },
      NUM() { token(isDigit, isDigit) }, // UNUSED
      CL(arg) { out += arg.slice(1,-1) },
      CI() { out += tok },
      OUT() { rval += out + "\n"; out = "\t" },
      CLL(arg) { stack.push([l1,l2,pc]); l1 = l2 = ''; jump(arg)},
      LB() { out = '' },
      GN1() { if (!l1) l1 = 'L'+ix++; out += l1; },
      GN2() { if (!l2) l2 = 'L'+ix++; out += l2; }, // UNUSED
      TST(arg) { 
        skipws(); 
        flag = text.slice(pos).startsWith(arg.slice(1,-1)) 
        if (flag) pos += arg.length - 2
      },
      SR() { 
        skipws()
        const s = pos
        if (text[pos] === "'") {
          pos++
          while (text[pos] !== "'") pos++
          pos++
          tok = text.slice(s,pos)
        }
        flag = pos != s
        DEBUG && console.log('$',{flag,tok})
      },
      R() {
        if (stack.length) { 
          [l1,l2,pc] = stack.pop();
        } else {
          return rval
        }
      },
    }
    let step = 0;
    for (; ; pc++) {
        const [lab, op, arg] = ll[pc];
        if (op === 'END') return rval
        DEBUG &&  console.log(pc, '@', pos, ll[pc].join('\t'))
        if (lab) continue
        (ops[op]||fail(op))(arg)
        if (step++ > 10000) throw "infinite loop/"
    }
}

const prog = fs.readFileSync('meta.s','utf8')
const meta = fs.readFileSync('meta.meta','utf8')
let rval = run(prog, meta)
fs.writeFileSync('meta2.s',rval)
if (rval !== prog) throw "mismatch"
let rval2 = run(rval,meta)
if (rval !== rval2) throw "mismatch2"
const jmeta = fs.readFileSync('js.meta','utf8')
const jprog = run(prog,jmeta)
const rval3 = run(jprog,jmeta)
fs.writeFileSync('meta3.js',rval3)