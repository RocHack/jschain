" complete.vim
" Autocomplete function for jschain

fun! CompleteJS(findstart, base)
  if a:findstart
    " assume we start at the beginning of the line
    return 0
  else

    " After the autocomplete, beautify the code
    " to expand it across lines
    augroup jschain
      autocmd!
      autocmd CompleteDone <buffer> call CompletedJS()
    augroup END

    " Gather the code to use as input
    " Use the code up to the current line
    let corpus = join(getline(1, '$'), "\n")
    exec system("node vim/complete.js " . line('.'), corpus)
    return {'words': [], 'refresh': 'always'}
  endif
endfun
set completefunc=CompleteJS

fun! CompletedJS()
  " Expand the code from one line to several
  exec '.!node vim/beautify.js'
  " remove the autocommand
  augroup jschain
    autocmd!
  augroup END
endfun

" vim:set ft=vim sw=2 sts=2 et:
