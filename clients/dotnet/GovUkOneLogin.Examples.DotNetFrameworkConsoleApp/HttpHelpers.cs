using System;
using System.Collections.Specialized;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace GovUkOneLogin.Examples.DotNetFrameworkConsoleApp
{
    internal static class HttpHelpers
    {

        public static async Task<NameValueCollection> WaitForCallbackQueryParameters(string callbackUrl)
        {
            var httpListener = new HttpListener();
            httpListener.Prefixes.Add(callbackUrl.EndsWith("/") ? callbackUrl : callbackUrl + "/");
            httpListener.Start();
            var context = await httpListener.GetContextAsync();
            var responseBytes = Encoding.UTF8.GetBytes("OK");
            context.Response.ContentType = "text/plain";
            context.Response.OutputStream.Write(responseBytes, 0, responseBytes.Length);
            context.Response.OutputStream.Close();
            httpListener.Stop();
            return context.Request.QueryString;
        }


        public static async Task WaitForLogin(string loginUrl, Func<Task<string>> GetLocation)
        {
            var httpListener = new HttpListener();
            httpListener.Prefixes.Add(loginUrl.EndsWith("/") ? loginUrl : loginUrl + "/");
            httpListener.Start();
            var context = await httpListener.GetContextAsync();
            var location = await GetLocation();
            context.Response.Redirect(location);
            context.Response.OutputStream.Close();
            httpListener.Stop();
        }
    }
}