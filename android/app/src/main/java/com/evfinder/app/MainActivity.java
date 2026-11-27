package com.evfinder.app;
import android.app.Activity;
import android.os.Bundle;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.*;
import android.widget.Toast;

public class MainActivity extends Activity {
 private WebView web;
 private GeolocationPermissions.Callback pending;
 private String pendingOrigin;
 private static final String HOST="jessiekong47.github.io";
 private static final String URL="https://jessiekong47.github.io/ev-finder/ev-finder/public/";
 private boolean trusted(Uri u){return "https".equals(u.getScheme()) && HOST.equals(u.getHost());}
 private boolean locationAllowed(){return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
 @Override public void onCreate(Bundle b){super.onCreate(b); web=new WebView(this);setContentView(web);
 WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setGeolocationEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setJavaScriptCanOpenWindowsAutomatically(false);
 web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(trusted(u))return false;if("https".equals(u.getScheme())||"geo".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(MainActivity.this,"No app available to open link",Toast.LENGTH_SHORT).show();}}return true;}});
 web.setWebChromeClient(new WebChromeClient(){@Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback cb){if(!trusted(Uri.parse(origin))){cb.invoke(origin,false,false);return;}if(locationAllowed()){cb.invoke(origin,true,false);return;}pending=cb;pendingOrigin=origin;requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},10);}});
 web.loadUrl(URL);
 }
 @Override public void onRequestPermissionsResult(int code,String[] p,int[] g){super.onRequestPermissionsResult(code,p,g);if(code==10&&pending!=null){pending.invoke(pendingOrigin,locationAllowed(),false);pending=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}
