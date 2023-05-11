# Do. Fancy and easy AI inside your editor.

An AI Content assistant without all the bells and whistles. Use your own OpenAI API key, or for free and ad supported (but very friendly) through the Do. servers.

How to use.

``` /do write me a haiku ```

That's it. Just prefix any command with /do and you are good to go. 

## There are two things need to know.

The tilde (backtick, or `) will revert to the previous /do command. You can easily regenerate after that by pressing enter.

{text} contains the contents of the input or textarea (Or contenteditable). So you can do

``` /do translate {text} for me ```

And it translates the things you have in your editor.

``` /do Summarize the following {text} ```

Will of course then, summarize all the text in the editor.

You can add your own OpenAI API key, or just use our server. It will be using GPT3.5-turbo and is ad supported. But very lightly. To dismiss an ad quickly use ` and regenerate.

## Rate limiting

Because I am not made of money, yet, but want to put it in as many hands as possible the endpoint is rate limited to 5 requests per minute for now. So the sixth will generate a 429- Rate limit exceeded. It's a sliding window so if you wait for a little bit, it will be good again. 

## Disclaimer

This is all a big experiment, to offer this free of charge using a basic but useful extension. I am not responsible for anything /do generates, nor is anything stored on any of the servers for secondary use, only logged for error handling purposes. Nothing will be sold or used for marketing purposes.

The OpenAI API key that you enter is only stored on your computer and is not shared. 



