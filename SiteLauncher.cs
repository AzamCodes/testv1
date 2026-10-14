using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class SiteLauncher
{
    [STAThread]
    private static void Main()
    {
        string page = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html");
        if (!File.Exists(page))
        {
            MessageBox.Show("index.html must remain in the same folder as this launcher.", "Mariahu College", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo(new Uri(page).AbsoluteUri) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show("The site could not be opened in your default browser.\n\n" + ex.Message, "Mariahu College", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
