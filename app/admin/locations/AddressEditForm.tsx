type Location={id:string;address:string|null;city:string;state:string;postal_code:string|null;country:string};
export default function AddressEditForm({location:l}:{location:Location}) {
  return <details style={{marginTop:16}}><summary style={{cursor:"pointer"}}>Edit address</summary>
    <form action="/api/admin/geocode" method="post" style={{display:"grid",gap:12,maxWidth:520,marginTop:12}}>
      <input type="hidden" name="action" value="edit_address"/>
      <input type="hidden" name="location" value={l.id}/>
      <input type="hidden" name="expected" value={JSON.stringify({address:l.address,city:l.city,state:l.state,postal_code:l.postal_code,country:l.country})}/>
      <input type="hidden" name="country" value="US"/>
      <label>Street / check-in address <input name="address" defaultValue={l.address ?? ''} maxLength={300} autoComplete="street-address" required/></label>
      <label>City <input name="city" defaultValue={l.city} maxLength={100} autoComplete="address-level2" required/></label>
      <label>State (two letters) <input name="state" defaultValue={l.state} maxLength={2} pattern="[A-Za-z]{2}" autoComplete="address-level1" required/></label>
      <label>ZIP code (optional) <input name="postal_code" defaultValue={l.postal_code ?? ''} inputMode="numeric" maxLength={5} pattern="[0-9]{5}" autoComplete="postal-code"/></label>
      <p>Enter the confirmed destination address. Saving does not add a pin. After saving, click Check missing addresses now to get a fresh proposal.</p>
      <button>Save address</button>
    </form>
  </details>;
}
