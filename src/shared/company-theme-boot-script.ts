import {
  COMPANY_THEME_VARS_STORAGE_KEY,
  LOGIN_BRANDING_STORAGE_KEY,
} from '@/shared/constants/branding';

const AUTH_STORAGE_KEY = 'rose-hr-auth';

/**
 * Runs in `<head>` before first paint.
 * 1. Precomputed CSS vars (fast path)
 * 2. Session / login branding hex → inline HSL conversion (migration + refresh)
 */
export const COMPANY_THEME_BOOT_SCRIPT = `(function(){
function normHex(v){if(!v||typeof v!=='string')return null;v=v.trim().toLowerCase();return/^#[0-9a-f]{6}$/.test(v)?v:null;}
function hexToHsl(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0,l=(max+min)/2,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}return Math.round(h*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';}
function fg(hsl){var l=parseFloat((hsl.split(' ')[2]||'50').replace('%',''));return l<55?'38 30% 97%':'180 25% 10%';}
function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
function scale(h,s,l){return{'--primary-50':h+' '+Math.round(s*0.73)+'% 96%','--primary-100':h+' '+Math.round(s*0.69)+'% 90%','--primary-200':h+' '+Math.round(s*0.64)+'% 80%','--primary-500':h+' '+Math.round(s*0.91)+'% '+clamp(l+12,0,100)+'%','--primary-700':h+' '+Math.round(s)+'% '+clamp(l+4,0,100)+'%','--primary-900':h+' '+Math.round(s*1.09)+'% '+clamp(l-6,8,100)+'%'};}
function applyVars(root,vars){for(var k in vars){if(Object.prototype.hasOwnProperty.call(vars,k))root.style.setProperty(k,vars[k]);}}
function applyHex(root,primary,secondary){var vars={},p=normHex(primary),s=normHex(secondary);if(p){var ph=hexToHsl(p),parts=ph.split(' '),h=+parts[0],sat=+parts[1].replace('%',''),lit=+parts[2].replace('%','');vars['--primary']=ph;vars['--primary-foreground']=fg(ph);vars['--ring']=ph;Object.assign(vars,scale(h,sat,lit));vars['--accent']=h+' '+Math.round(sat*0.55)+'% 92%';vars['--accent-foreground']=ph;}if(s){var sh=hexToHsl(s);vars['--secondary']=sh;vars['--secondary-foreground']=fg(sh);}if(Object.keys(vars).length)applyVars(root,vars);}
function pickColors(){var primary=null,secondary=null;try{var authRaw=sessionStorage.getItem(${JSON.stringify(AUTH_STORAGE_KEY)});if(authRaw){var auth=JSON.parse(authRaw),profile=auth.state&&auth.state.accessProfile;if(profile&&profile.companies&&profile.companies.length){var cid=profile.defaultCompanyId,company=null;for(var i=0;i<profile.companies.length;i++){if(profile.companies[i].companyId===cid){company=profile.companies[i];break;}}if(!company)company=profile.companies[0];if(company){primary=company.companyPrimaryColor;secondary=company.companySecondaryColor;}}}}catch(e){}if(!primary&&!secondary){try{var br=localStorage.getItem(${JSON.stringify(LOGIN_BRANDING_STORAGE_KEY)});if(br){var b=JSON.parse(br);primary=b.companyPrimaryColor;secondary=b.companySecondaryColor;}}catch(e){}}return{primary:primary,secondary:secondary};}
try{
  var root=document.documentElement;
  var raw=localStorage.getItem(${JSON.stringify(COMPANY_THEME_VARS_STORAGE_KEY)});
  if(raw){var vars=JSON.parse(raw);applyVars(root,vars);return;}
  var colors=pickColors();
  if(colors.primary||colors.secondary){applyHex(root,colors.primary,colors.secondary);}
}catch(e){}
})();`;
