const botSend = require("../core/send");
const db = require("../core/db");
const logger = require("../core/logger");

// --------------------
// Handle stop command
// --------------------

module.exports = function(data)
{

   console.log("exports() - 1");
   //
   // Disallow this command in Direct/Private messages
   //

   if (data.message.channel.type === "dm")
   {
      data.color = "warn";
      data.text =
         ":no_entry:  This command can only be called in server channels.";

      return botSend(data);
   }

   console.log("exports() - 2");
   //
   // Disallow multiple destinations
   //

   if (data.cmd.for.length > 1)
   {
      data.color = "error";
      data.text = ":warning:  Please specify only one `for` value.";
      return botSend(data);
   }

   console.log("exports() - 3");
   //
   // Disallow non-managers to stop for others
   //

   if (data.cmd.for[0] !== "me" && !data.message.isManager)
   {
      data.color = "error";
      data.text =
         ":cop:  You need to be a channel manager to stop auto translating " +
         "this channel for others.";

      return botSend(data);
   }

   //
   // Prepare task data
   //

   console.log("exports() - 4");
   const origin = data.message.channel.id;
   const dest = destID(data.cmd.for[0], data.message.author.id);
   const destDisplay = destResolver(data.cmd.for[0], data.message.author.id);
   console.log("origion = " + origin);
   console.log("dest = " + dest);
   console.log("destDisplay = " + destDisplay);

   //
   // Check if task actually exists
   //

   db.checkTask(origin, dest, function(err, res)
   {
      console.log("checkTask()");
      console.log("checkTask() err - " + err);
      console.log("checkTask() res - " + res);
      if (err)
      {
         return dbError(err, data);
      }

      //
      // Error if task does not exist
      //

      if (res.length < 1 || !res)
      {
         data.color = "error";
         data.text =
            ":warning:  This channel is __**not**__ being translated for " +
            `**${destDisplay}**.`;

         if (dest === "all")
         {
            data.text =
               ":warning:  This channel is not being automatically " +
               "translated for anyone.";
         }

         return botSend(data);
      }

      //
      // Otherwise, proceed to remove task from database
      //

      removeTask(res, data, origin, dest, destDisplay);
   });
};

// ---------------------
// Remove from database
// ---------------------

const removeTask = function(res, data, origin, dest, destDisplay)
{
   db.removeTask(origin, dest, function(err)
   {
      data.color = "ok";
      data.text = "remoteTask()"
      botSend(data);
      if (err)
      {
         return dbError(err, data);
      }

      data.color = "ok";
      data.text =
         ":negative_squared_cross_mark:  Auto translation of this " +
         "channel has been stopped for **" + destDisplay + "**";

      if (dest === "all")
      {
         data.text += ` (${res.length})`;
      }

      data.text += ".";
      return botSend(data);
   });
};

// -----------------------
// Destination ID handler
// -----------------------

const destID = function(dest, author)
{
   if (dest.startsWith("<#"))
   {
      return dest.slice(2,-1);
   }
   if (dest.startsWith("<@"))
   {
      return dest.slice(1,-1);
   }
   if (dest === "me")
   {
      return "@" + author;
   }
   return dest;
};

const destResolver = function(dest, author)
{
   if (dest === "me")
   {
      return "<@" + author + ">";
   }
   return dest;
};

// --------------------
// Database error
// --------------------

const dbError = function(err, data)
{
   data.color = "error";
   data.text =
      ":warning:  Could not retrieve information from database. Try again " +
      "later or report this issue to an admin if problem continues. (" + err + ")";

   botSend(data);
   return console.log("error", JSON.stringify(err));
};
