import { ImageResponse } from "next/og";
export async function GET(_request: Request, { params }: { params: Promise<{size: string}> }) {
  const { size } = await params;
  if (!["32","180","192","512"].includes(size)) return new Response("Not found", {status:404});
  const pixels = Number(size);
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#153b45",color:"white",fontSize:pixels*0.36,fontWeight:700,letterSpacing:-pixels*0.025}}>DP</div>,
    {width:pixels,height:pixels,headers:{"Cache-Control":"public, max-age=86400"}},
  );
}
