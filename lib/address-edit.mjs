const fields=['address','city','state','postal_code','country'];
export function parseAddressEdit(form) {
  const id=form.get('location');
  if(typeof id!=='string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) throw Error('Invalid location');
  const values={};
  for(const key of fields) {
    const value=form.get(key);
    if(typeof value!=='string' || value.length>300) throw Error('Invalid address field');
    values[key]=value.trim();
  }
  values.state=values.state.toUpperCase();values.country=values.country.toUpperCase();
  if(!values.address || !values.city || values.city.length>100 || !/^[A-Z]{2}$/.test(values.state) || values.country!=='US' || (values.postal_code && !/^\d{5}$/.test(values.postal_code))) throw Error('Check address fields');
  const expected=JSON.parse(String(form.get('expected') ?? ''));
  if(!expected || Array.isArray(expected) || typeof expected!=='object') throw Error('Missing original address');
  for(const key of fields) if(!(key in expected) || (expected[key]!==null && (typeof expected[key]!=='string' || expected[key].length>300))) throw Error('Invalid original address');
  return {id,values:{...values,postal_code:values.postal_code || null},expected:Object.fromEntries(fields.map(key=>[key,expected[key]]))};
}
